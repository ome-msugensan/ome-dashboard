/* Deploy as a web app executing as the user accessing it. */
const REPORT_FOLDER_ID = '1dF-RC0goKUz38hjwOvVwEui6fxzHvV5h';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const UPLOAD_CHUNK_BYTES = 1024 * 1024;
function doGet(e) {
  if (e.parameter.mode === 'read') {
    const t = HtmlService.createTemplateFromFile('Reader');
    t.fileId = String(e.parameter.id || '');
    return t.evaluate().setTitle('Annual report reader').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  const origin = String(e.parameter.origin || '');
  const allowed = ['https://ome-dashboard.infinityfree.io', 'http://127.0.0.1:8000', 'http://localhost:8000'];
  const isCatalog = e.parameter.mode === 'catalog';
  const t = HtmlService.createTemplateFromFile(isCatalog ? 'Catalog' : 'Manager');
  t.omeOrigin = allowed.indexOf(origin) >= 0 ? origin : 'https://ome-dashboard.infinityfree.io';
  t.messageToken = /^[a-f0-9]{32}$/.test(e.parameter.token || '') ? e.parameter.token : '';
  return t.evaluate().setTitle(isCatalog ? 'Connect annual reports' : 'Manage annual report files').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function readEpub(id) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(id || ''))) throw new Error('Invalid file.');
  const file = DriveApp.getFileById(id), parents = file.getParents();
  let found = false;
  while (parents.hasNext()) if (parents.next().getId() === REPORT_FOLDER_ID) found = true;
  if (!found || !/\.epub$/i.test(file.getName()) || file.isTrashed()) throw new Error('This EPUB is not in the annual reports folder.');
  if (file.getSize() > MAX_BYTES) throw new Error('This reader supports EPUB files up to 5 MB.');
  return Utilities.base64Encode(file.getBlob().getBytes());
}
function listReports() {
  const files = DriveApp.getFolderById(REPORT_FOLDER_ID).getFiles(), items = [];
  while (files.hasNext()) {
    const file = files.next(), match = /\.(pdf)$/i.exec(file.getName());
    if (match && !file.isTrashed()) items.push({id:file.getId(), name:file.getName(), type:match[1].toLowerCase()});
  }
  return items.sort((a,b) => a.name.localeCompare(b.name));
}
function uploadReport(name, base64) {
  name = String(name || '').trim();
  if (name.length > 220 || !/\.pdf$/i.test(name) || /[\x00-\x1f\/\\]/.test(name)) throw new Error('Choose a PDF file with a valid name.');
  if (typeof base64 !== 'string' || base64.length > Math.ceil(MAX_BYTES * 4 / 3) + 4) throw new Error('This upload is larger than 5 MB.');
  const bytes = Utilities.base64Decode(base64);
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Choose a file no larger than 5 MB.');
  const type = 'pdf';
  const signature = bytes.slice(0, 5).map(n => (n + 256) % 256);
  if (type === 'pdf' && signature.join(',') !== '37,80,68,70,45') throw new Error('The file is not a valid PDF.');
  const folder = DriveApp.getFolderById(REPORT_FOLDER_ID);
  const file = folder.createFile(Utilities.newBlob(bytes, 'application/pdf', name));
  return {id:file.getId(), name:file.getName(), type};
}
// A resumable Drive session stays on the server, scoped to the signed-in user.
function beginPdfUpload(name, size) {
  name = String(name || '').trim(); size = Number(size);
  if (name.length > 220 || !/\.pdf$/i.test(name) || /[\x00-\x1f\/\\]/.test(name)) throw new Error('Choose a PDF file with a valid name.');
  if (!Number.isInteger(size) || size < 5 || size > MAX_UPLOAD_BYTES) throw new Error('Choose a PDF no larger than 50 MB.');
  DriveApp.getFolderById(REPORT_FOLDER_ID).getName();
  const response = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name', {
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type':'application/pdf', 'X-Upload-Content-Length':String(size)},
    payload:JSON.stringify({name:name, mimeType:'application/pdf', parents:[REPORT_FOLDER_ID]})
  });
  if (response.getResponseCode() !== 200) throw new Error('Could not start the Google Drive upload. Check access and authorization.');
  const headers = response.getHeaders();
  const location = headers.Location || headers.location;
  if (typeof location !== 'string' || !/^https:\/\/www\.googleapis\.com\//.test(location)) throw new Error('Google Drive did not return a valid upload session.');
  const id = Utilities.getUuid();
  CacheService.getUserCache().put('annual-upload-' + id, JSON.stringify({url:location,size:size,offset:0,name:name}), 600);
  return {sessionId:id, chunkSize:UPLOAD_CHUNK_BYTES};
}
function uploadPdfChunk(id, offset, base64) {
  if (!/^[a-f0-9-]{36}$/i.test(String(id || ''))) throw new Error('Invalid upload session.');
  const cache = CacheService.getUserCache(), key = 'annual-upload-' + id, saved = cache.get(key);
  if (!saved) throw new Error('The upload session expired. Please start again.');
  const session = JSON.parse(saved);
  if (!Number.isInteger(offset) || offset !== session.offset || typeof base64 !== 'string' || base64.length > Math.ceil(UPLOAD_CHUNK_BYTES * 4 / 3) + 4) throw new Error('Invalid upload chunk. Please start again.');
  const bytes = Utilities.base64Decode(base64), expected = Math.min(UPLOAD_CHUNK_BYTES, session.size - offset);
  if (bytes.length !== expected) throw new Error('Incomplete upload chunk. Please start again.');
  if (offset === 0 && bytes.slice(0, 5).map(n => (n + 256) % 256).join(',') !== '37,80,68,70,45') throw new Error('The selected file is not a valid PDF.');
  const end = offset + bytes.length - 1;
  const response = UrlFetchApp.fetch(session.url, {method:'put', contentType:'application/pdf', payload:bytes, followRedirects:false, muteHttpExceptions:true,
    headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken(), 'Content-Range':`bytes ${offset}-${end}/${session.size}`}});
  const code = response.getResponseCode();
  if (code === 200 || code === 201) {
    if (end + 1 !== session.size) throw new Error('Google Drive completed the upload unexpectedly.');
    const file = JSON.parse(response.getContentText());
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(file.id || '')) throw new Error('Google Drive did not return the uploaded file.');
    cache.remove(key); return {done:true, id:file.id, name:session.name, type:'pdf'};
  }
  if (code !== 308) throw new Error('Google Drive could not upload this part of the file. Please try again.');
  const headers = response.getHeaders(), range = String(headers.Range || headers.range || ''), match = /^bytes=0-(\d+)$/.exec(range);
  if (!match || Number(match[1]) !== end) throw new Error('Google Drive did not confirm the full upload. Please start again.');
  session.offset = end + 1; cache.put(key, JSON.stringify(session), 600);
  return {done:false, nextOffset:session.offset};
}
function trashReport(id) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(id || ''))) throw new Error('Invalid file.');
  const folder = DriveApp.getFolderById(REPORT_FOLDER_ID), file = DriveApp.getFileById(id), parents = file.getParents();
  let found = false;
  while (parents.hasNext()) if (parents.next().getId() === folder.getId()) found = true;
  if (!found || !/\.pdf$/i.test(file.getName())) throw new Error('This file is not a PDF in the annual reports folder.');
  file.setTrashed(true);
  return {id:file.getId()};
}
