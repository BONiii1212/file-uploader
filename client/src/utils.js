// 创建formData
export function createFormData ({
    process,
    index,
    type,
    md5,
    file,
    size,
    chunkCount
}){
    const fd = new FormData()
    fd.append('process', process)
    fd.append('index', index)
    fd.append('type',type)
    fd.append('md5',md5)
    fd.append('file', file)
    fd.append('size', size)
    fd.append('chunkCount', chunkCount)
    return fd
}

// 并行池
export async function limitPool(limitNum, dataArr, Fun){
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

// 获取本地缓存的数据
function getUploadedFromStorage(md5){
    return JSON.parse(localStorage.getItem(md5) || "{}")
}

// 写入本地缓存
export function setUploadedToStorage(md5,index){
    let obj = getUploadedFromStorage(md5)
    obj[index] = true;
    localStorage.setItem(md5, JSON.stringify(obj))
}

//校验是否已经上传
export function checkFileSlice(md5, index){
    let obj = getUploadedFromStorage(md5)
    return obj[index]
}

// 获取文件后缀名
export function getFileType(fileName) {
    return fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase()
}