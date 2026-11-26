const BASE='/api';
const TOKEN='needit_access_token';
export const token={get:()=>sessionStorage.getItem(TOKEN),set:v=>sessionStorage.setItem(TOKEN,v),clear:()=>sessionStorage.removeItem(TOKEN)};
export async function api(path,{method='GET',body,auth=true}={}){
 const form=body instanceof FormData;
 const res=await fetch(BASE+path,{method,headers:{...(form||body===undefined?{}:{'Content-Type':'application/json'}),...(auth&&token.get()?{Authorization:'Bearer '+token.get()}:{})},body:body===undefined?undefined:form?body:JSON.stringify(body),cache:'no-store'});
 let value;try{value=await res.json()}catch{value=null}
 if(!res.ok)throw new Error(value?.message||value?.error||`요청 실패 (HTTP ${res.status})`);
 return value?.data??value;
}
export const qs=o=>{const p=new URLSearchParams();Object.entries(o).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')p.set(k,v)});return p.toString()};
export const svc={
 login:(username,password)=>api('/auth/login',{method:'POST',body:{username,password},auth:false}),
 signup:body=>api('/auth/signup',{method:'POST',body,auth:false}),
 me:()=>api('/members/me'),
 profile:(type,body)=>api('/members/me/'+type,{method:'PATCH',body}),
 requests:params=>api('/requests?'+qs(params)),
 request:id=>api('/requests/'+id),
 myRequests:()=>api('/requests/me'),
 createRequest:body=>api('/requests',{method:'POST',body}),
 updateRequest:(id,body)=>api('/requests/'+id,{method:'PATCH',body}),
 deleteRequest:id=>api('/requests/'+id,{method:'DELETE'}),
 closeRequest:id=>api('/requests/'+id+'/close',{method:'PATCH'}),
 completeOffer:id=>api('/offers/'+id+'/complete',{method:'PATCH'}),
 deleteRequestImage:(requestId,imageId)=>api('/requests/'+requestId+'/images/'+imageId,{method:'DELETE'}),
 uploadRequest:(id,files)=>{const body=new FormData();for(const f of files)body.append('files',f);return api('/requests/'+id+'/images',{method:'POST',body})},
 offer:(id,body)=>api('/requests/'+id+'/offers',{method:'POST',body}),
 offers:direction=>api('/offers/'+direction),
 offerAction:(id,action)=>api('/offers/'+id+'/'+action,{method:'PATCH'}),
 chats:()=>api('/chats'),
 messages:id=>api('/chats/'+id+'/messages'),
 readChat:id=>api('/chats/'+id+'/read',{method:'PATCH'}),
 uploadChat:(id,file)=>{const body=new FormData();body.append('file',file);return api('/chats/'+id+'/images',{method:'POST',body})},
 notifications:()=>api('/notifications'),
 readNotification:id=>api('/notifications/'+id+'/read',{method:'PATCH'}),
 readAll:()=>api('/notifications/read-all',{method:'PATCH'}),
 deleteNotification:id=>api('/notifications/'+id,{method:'DELETE'}),
 favorites:()=>api('/members/me/favorites'),
 favorite:(id,method)=>api('/item-requests/'+id+'/favorites',{method}),
 search:keyword=>api('/searches',{method:'POST',body:{keyword}}),
 popular:()=>api('/searches/popular'),
 report:body=>api('/reports',{method:'POST',body}),
 block:(id,method)=>api('/blocks/'+id,{method}),
 blocked:()=>api('/blocks/me'),
 adList:()=>api('/ads'),
 adminLogs:params=>api('/admin/user-actions?'+qs(params)),
 adminStats:()=>api('/admin/user-actions/filter-statistics'),
 adminCampaigns:()=>api('/admin/campaigns'),
 adminBanners:()=>api('/admin/banners'),
 adminReports:()=>api('/admin/reports'),
 adminMembers:()=>api('/admin/members'),
 adminDashboard:()=>api('/admin/dashboard/summary')
};
