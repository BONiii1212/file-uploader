const calculateFileMd5 = (file, chunkSize) => {
    return new Promise((resolve, reject)=>{
        const worker = new Worker("src/hash.js")
        worker.postMessage({file,chunkSize})
        worker.onmessage = event => {
            const {status, md5} = event.data
            if(status === 'success'){
                resolve(md5)
            }else{
                reject('oops, something went wrong.')
            }
        }
    })
}

export default calculateFileMd5