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

    //当前上传大小
    let uploadedSize = 0

    const init = () => {
        bindEvent();
    }

    function bindEvent() {
        oBtn.addEventListener('click', uploadFile, false);
    }

    async function uploadFile() {
        const file = oUploader.files[0]
        if(!file){
            oInfo.innerText = UPLOAD_INFO['NO_FILE'];
            return
        }
        if(!ALLOWED_TYPE[file.type]){
            oInfo.innerText = UPLOAD_INFO['INVALID_TYPE'];
            return
        }
        oInfo.innerText = ''
        const {name, type, size} = file
        const fileName = new Date().getTime() + '_' + name
        oProgress.max = size
        let uploadedResult = null

        while(uploadedSize < size){
            const fileChunk = file.slice(uploadedSize, uploadedSize + CHUNK_SIZE)
            const formData = createFormData({
                name,
                type,
                size,
                fileName,
                uploadedSize,
                file: fileChunk
            })
            try{
                uploadedResult = await axios.post(API.UPLOAD, formData)
            }catch(error){
                oInfo.innerText = UPLOAD_INFO['UPLOAD_FAILED']
                return
            }
            uploadedSize += fileChunk.size
            oProgress.value = uploadedSize
        }
        oInfo.innerText = UPLOAD_INFO['UPLOAD_SUCCESS']
        oUploader.value = null
    }

    function createFormData ({
        name,
        type,
        size,
        fileName,
        uploadedSize,
        file
    }){
        const fd = new FormData()
        fd.append('name', name)
        fd.append('type',type)
        fd.append('size',size)
        fd.append('fileName',fileName)
        fd.append('uploadedSize', uploadedSize)
        fd.append('file', file)
        return fd
    }

    init();
})(document);