const UPLOAD_INFO = {
    'NO_FILE':'请先选择文件',
    'INVALID_TYPE':'不支持该类型文件上传',
    'UPLOAD_FAILED':'上传失败',
    'UPLOAD_SUCCESS':'上传成功'
}
const ALLOWED_TYPE = {
    'video/mp4':'mp4',
    'video/ogg':'ogg',
}
const CHUNK_SIZE = 64 * 1024
const API = {
    UPLOAD:'http://127.0.0.1:8000/uploadFile'
}

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

    function uploadFile() {
        // 获取input中的文件
        const file = oUploader.files[0]
        // 文件判空
        if(!file){
            oInfo.innerText = UPLOAD_INFO['NO_FILE'];
            return
        }
        // 文件类型检测
        if(!ALLOWED_TYPE[file.type]){
            oInfo.innerText = UPLOAD_INFO['INVALID_TYPE'];
            return
        }
        oInfo.innerText = ''
        const {name, type, size} = file
        // 保存chunk块
        let chunks = []
        let token = (+new Date())
        oProgress.max = size

        //当前上传大小
        let uploadedSize = 0

        // 需要进行文件拆分
        if(size > CHUNK_SIZE){
            while(uploadedSize < size){
                const fileChunk = file.slice(uploadedSize, uploadedSize + CHUNK_SIZE)
                chunks.push(fileChunk)
                uploadedSize += fileChunk.size
            }
        }else{
            chunks.push(file.slice(0))
        }

        // 分片的数量
        let chunkCount = chunks.length
        let dataArr = []
        for(let i = 0; i<chunkCount; i++){
            const formData = createFormData({
                index:i,
                type,
                token,
                file:chunks[i]
            })    
            dataArr.push(formData)
        }

        limitPool(1, dataArr, createAxios).then(res=>{
            const fd = new FormData()
            fd.append('type', 'merge')
            fd.append('token',token)
            fd.append('chunkCount', chunkCount)
            fd.append('filename', name)
            oInfo.innerText = UPLOAD_INFO['UPLOAD_SUCCESS']
            oUploader.value = null
            return axios.post(API.UPLOAD, fd)
        },rej=>{
            oInfo.innerText = UPLOAD_INFO['UPLOAD_FAILED']
            return
        }).then(()=>console.log('success'))
    }

    function createFormData ({
        index,
        type,
        token,
        file
    }){
        const fd = new FormData()
        fd.append('index', index)
        fd.append('type',type)
        fd.append('token',token)
        fd.append('file', file)
        return fd
    }
    function createAxios(data){
        return axios.post(API.UPLOAD, data).then(()=>oProgress.value = oProgress.value + CHUNK_SIZE)
    }
    async function limitPool(limitNum, dataArr, Fun){
        let result = []
        let executing = []
        for(let data of dataArr){
            let p = Promise.resolve(Fun(data))
            result.push(p)
            if(limitNum<dataArr){
                let e = p.then(()=>executing.splice(executing.indexOf(e), 1))
                executing.push(e)
                if(executing.length>=limitNum){
                    await Promise.race(executing)
                }
            }
        }
        return Promise.all(result)
    }
    init();
})(document);