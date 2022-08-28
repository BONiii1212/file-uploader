const express = require('express')
const bodyParser = require('body-parser') 
const uploader = require('express-fileupload')
const { resolve } = require('path')
const {
    writeFileSync,
    createWriteStream,
    createReadStream,
    unlink
} = require('fs')

const app = express()

const PORT = 8000
// 中间件
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(uploader());
app.use('/', express.static('upload_temp'))

app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin','*')
    res.header('Access-Control-Allow-Methods', 'POST,GET')
    next()
})

app.post('/uploadFile',(req, res)=>{
    const {
        process,
        index,
        type,
        md5,
        chunkCount,
        size,
    } = req.body
    if(process == 'merge'){
        const filePath = resolve(__dirname,'./upload/'+md5+'.'+type)
        let writeStream = createWriteStream(filePath)
        let s_index = 0
        function fnMergeFile(){
            let fname = resolve(__dirname,'./upload_temp/'+md5+'_'+s_index+'.'+type)
            let readStream = createReadStream(fname)
            readStream.pipe(writeStream, {end: false})
            readStream.on("end",function(){
                unlink(fname, function(err){
                    if(err){
                        throw err
                    }
                })
                if(s_index+1 < chunkCount){
                    s_index += 1
                    fnMergeFile()
                }
            })
        }
        fnMergeFile()
        res.send({
            code:0,
            msg:'文件合并成功了'
        })
    }else if(process == 'upload'){
        const { file } = req.files
        if(!file){
            res.send({
                code:1001,
                msg:'No file uploaded'
            });
            return
        }
        const filePath = resolve(__dirname,'./upload_temp/'+md5+'_'+index+'.'+type)
        writeFileSync(filePath, file.data)
        res.send({
            code:0,
            index: index,
            size: size,
            msg:'文件片上传成功',
        })
        return
    }
})

app.listen(PORT,()=>{
    console.log('Server is running on ' + PORT)
})
