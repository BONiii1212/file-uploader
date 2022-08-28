import calculateFileMd5 from "./calculateMd5";
import {UPLOAD_INFO, CHUNK_SIZE, API} from "./constant"
import {createFormData, limitPool, setUploadedToStorage, checkFileSlice, getFileType} from './utils'

;((doc)=>{
    const oProgress = doc.querySelector('#uploadProgress');
    const oUploader = doc.querySelector('#fileUploader');
    const oInfo = doc.querySelector('#uploadInfo');
    const oBtn = doc.querySelector('#uploadBtn');

    const init = () => {
        bindEvent();
    }

    function bindEvent() {
        oBtn.addEventListener('click', uploadFile, false);
    }

    /* 
    * 大文件上传方法
    */
    async function uploadFile() {
        // 获取input中的文件
        const file = oUploader.files[0]
        // 文件判空
        if(!file){
            oInfo.innerText = UPLOAD_INFO['NO_FILE'];
            return
        }
        oInfo.innerText = ''
        const {name, size} = file

        let fileType = getFileType(name)
        const md5 = await calculateFileMd5(file, CHUNK_SIZE)

        oProgress.max = 0

        // 当前上传大小
        let start = 0
        // 将文件进行切块
        let chunks = []
        while(start < size){
            const fileChunk = file.slice(start, start + CHUNK_SIZE)
            chunks.push(fileChunk)
            start += fileChunk.size
        }

        // 将分片封装成formData格式
        let dataArr = []
        for(let i = 0; i<chunks.length; i++){
            const formData = createFormData({
                process:'upload',
                index:i,
                type:fileType,
                md5,
                file:chunks[i],
                size:chunks[i].size
            })
            // 断点续传的功能  
            // 如果没有的话，添加到dataArr中
            if(!checkFileSlice(md5, i)){
                dataArr.push(formData)
                // 记录总的进度条value
                oProgress.value = oProgress.value + chunks[i].size
            }    
        }
        console.log(dataArr)
        // 调用并行池，并发控制请求发送，在全部成功后，发送合并请求
        limitPool(1, dataArr, createAxios).then(res=>{
            const formData = createFormData({
                process:'merge',
                type:fileType,
                md5,
                chunkCount:chunks.length
            })
            oInfo.innerText = UPLOAD_INFO['UPLOAD_SUCCESS']
            oUploader.value = null
            return axios.post(API.UPLOAD, formData)
        },rej=>{
            oInfo.innerText = UPLOAD_INFO['UPLOAD_FAILED']
            return
        }).then(()=>console.log('merge success'))

        // 将data生成请求
        function createAxios(data){
            return axios.post(API.UPLOAD, data).then(res => {
                oProgress.value = oProgress.value + res.data.size
                setUploadedToStorage(md5, res.data.index)
            })
        }
    }

    init();
})(document);