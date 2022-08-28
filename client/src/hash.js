self.onmessage = event => {
    self.importScripts('../node_modules/spark-md5/spark-md5.min.js')
    const {file, chunkSize} = event.data
    let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
    let currentChunk = 0
    let chunks = Math.ceil(file.size / chunkSize)
    const spark = new self.SparkMD5.ArrayBuffer()
    const fileReader = new FileReader();

    fileReader.onload = function (e) {
        spark.append(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
            loadNext();
        } else {
            const md5 = spark.end()
            self.postMessage({
                status:'success',
                md5:md5
            })
            self.close()
        }
    };

    fileReader.onerror = function () {
        self.postMessage({
            status:'error',
            md5:''
        });
    };

    function loadNext() {
        let start = currentChunk * chunkSize,
            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }
    loadNext();
}