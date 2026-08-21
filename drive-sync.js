(function(root){
  'use strict';

  const CLIENT_ID='553557508303-ng1rp08sp28mn8km8ielv79cgoug71ua.apps.googleusercontent.com';
  const SCOPE='https://www.googleapis.com/auth/drive.appdata';
  const API='https://www.googleapis.com/drive/v3';
  const UPLOAD='https://www.googleapis.com/upload/drive/v3';
  const PACK_FILE='jeongbo-private-pack-v2.json';
  const PROGRESS_FILE='jeongbo-progress-v2.json';
  let config=null;
  let tokenClient=null;
  let accessToken='';
  let progressTimer=null;
  let busy=false;

  const status=(message,tone='')=>config?.onStatus?.(message,tone);
  const authHeaders=()=>({Authorization:`Bearer ${accessToken}`});

  async function apiFetch(url,options={}){
    const response=await fetch(url,{...options,headers:{...authHeaders(),...(options.headers||{})}});
    if(response.status===401){accessToken='';config?.onConnection?.(false);throw new Error('Google 로그인이 만료되었습니다. 다시 연결해 주세요.');}
    if(!response.ok){const body=await response.text();throw new Error(`Drive 요청 실패 (${response.status})${body?`: ${body.slice(0,160)}`:''}`);}
    return response;
  }

  async function findFile(name){
    const q=`name='${name.replaceAll("'","\\'")}' and trashed=false`;
    const url=`${API}/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=${encodeURIComponent('files(id,name,modifiedTime,size)')}&orderBy=modifiedTime desc`;
    const data=await (await apiFetch(url)).json();
    return data.files?.[0]||null;
  }

  async function readJsonFile(file){
    return (await apiFetch(`${API}/files/${encodeURIComponent(file.id)}?alt=media`)).json();
  }

  async function writeJsonFile(name,value,existing=null){
    const body=JSON.stringify(value);
    if(existing){
      return (await apiFetch(`${UPLOAD}/files/${encodeURIComponent(existing.id)}?uploadType=media&fields=id,name,modifiedTime`,{
        method:'PATCH',headers:{'Content-Type':'application/json;charset=utf-8'},body
      })).json();
    }
    const boundary=`jeongbo_${crypto.randomUUID().replaceAll('-','')}`;
    const multipart=[
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,parents:['appDataFolder']})}`,
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${body}`,
      `--${boundary}--`
    ].join('\r\n');
    return (await apiFetch(`${UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime`,{
      method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body:multipart
    })).json();
  }

  async function syncPack(){
    const local=await config.getPack();
    const remoteFile=await findFile(PACK_FILE);
    if(remoteFile&&!local){
      status('Drive에서 1,800문항 기출팩을 내려받는 중…');
      await config.setPack(await readJsonFile(remoteFile));
      return 'downloaded';
    }
    if(local&&!remoteFile){
      status('개인용 기출팩을 비공개 Drive 공간에 저장하는 중…');
      await writeJsonFile(PACK_FILE,local);
      return 'uploaded';
    }
    return remoteFile&&local?'ready':'empty';
  }

  async function syncProgress(){
    const local=config.getProgress();
    const remoteFile=await findFile(PROGRESS_FILE);
    if(!remoteFile){await writeJsonFile(PROGRESS_FILE,local);return 'uploaded';}
    const remote=await readJsonFile(remoteFile);
    const localTime=Date.parse(local.updatedAt||0)||0;
    const remoteTime=Date.parse(remote.updatedAt||0)||0;
    if(remoteTime>localTime){config.setProgress(remote);return 'downloaded';}
    if(localTime>remoteTime){await writeJsonFile(PROGRESS_FILE,local,remoteFile);return 'uploaded';}
    return 'ready';
  }

  async function syncNow(){
    if(!accessToken)throw new Error('먼저 Google Drive를 연결해 주세요.');
    if(busy)return;
    busy=true;config?.onBusy?.(true);status('Google Drive와 동기화하는 중…');
    try{
      const [pack,progress]=await Promise.all([syncPack(),syncProgress()]);
      const packText=pack==='downloaded'?'기출팩 내려받음':pack==='uploaded'?'기출팩 업로드됨':pack==='ready'?'기출팩 확인됨':'기출팩 없음';
      const progressText=progress==='downloaded'?'진도 복원됨':progress==='uploaded'?'진도 저장됨':'진도 최신';
      status(`${packText} · ${progressText}`,'good');
      config?.onSynced?.({pack,progress});
    }catch(error){status(error.message,'bad');throw error;}
    finally{busy=false;config?.onBusy?.(false);}
  }

  function requestToken(){
    return new Promise((resolve,reject)=>{
      if(!root.google?.accounts?.oauth2)return reject(new Error('Google 로그인 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));
      tokenClient=tokenClient||root.google.accounts.oauth2.initTokenClient({
        client_id:CLIENT_ID,scope:SCOPE,
        callback:response=>{
          if(response.error)return reject(new Error(response.error_description||response.error));
          accessToken=response.access_token;config?.onConnection?.(true);resolve(response);
        },
        error_callback:error=>reject(new Error(error?.message||'Google 로그인 창을 완료하지 못했습니다.'))
      });
      tokenClient.requestAccessToken({prompt:accessToken?'':'consent'});
    });
  }

  async function connect(){
    status('Google 계정 연결을 기다리는 중…');
    try{await requestToken();await syncNow();}
    catch(error){status(error.message,'bad');throw error;}
  }

  function queueProgress(){
    if(!accessToken||busy)return;
    clearTimeout(progressTimer);
    progressTimer=setTimeout(()=>syncProgress().then(()=>status('진도를 Drive에 자동 저장했습니다.','good')).catch(error=>status(error.message,'bad')),1400);
  }

  async function uploadPack(){
    if(!accessToken)return;
    const local=await config.getPack();if(!local)return;
    const remote=await findFile(PACK_FILE);
    status('개인용 기출팩을 비공개 Drive 공간에 저장하는 중…');
    await writeJsonFile(PACK_FILE,local,remote);
    status('기출팩을 Drive에 비공개로 저장했습니다.','good');
  }

  root.DriveSync={
    configure(options){config=options;},connect,syncNow,queueProgress,uploadPack,
    isConnected:()=>Boolean(accessToken),clientId:CLIENT_ID
  };
})(globalThis);
