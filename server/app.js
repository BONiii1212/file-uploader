const express = require('express')
const bodyParser = require('body-parser') 
const uploader = require('express-fileupload')
const { extname,resolve } = require('path')
const {
    existsSync,
    appendFileSync,
    writeFileSync,
    createWriteStream,
    createReadStream,
    unlink
} = require('fs')

const ALLOWED_TYPE = {
    'video/mp4':'mp4',
    'video/ogg':'ogg',
}

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
        type,
        index,
        token,
        chunkCount,
        filename,
    } = req.body
    if(type == 'merge'){
        const filePath = resolve(__dirname,'./upload/'+token+'_'+filename)
        let writeStream = createWriteStream(filePath)
        let cindex = 0
        function fnMergeFile(){
            let fname = resolve(__dirname,'./upload_temp/'+token+'_'+cindex+'.mp4')
            let readStream = createReadStream(fname)
            readStream.pipe(writeStream, {end: false})
            readStream.on("end",function(){
                unlink(fname, function(err){
                    if(err){
                        throw err
                    }
                })
                if(cindex+1 < chunkCount){
                    cindex += 1
                    fnMergeFile()
                }
            })
        }
        fnMergeFile()
        res.send({
            code:0,
            msg:'File is 合并了'
        })
    }else{
        const { file } = req.files
        if(!file){
            res.send({
                code:1001,
                msg:'No file uploaded'
            });
            return
        }
        if(!ALLOWED_TYPE[type]){
            res.send({
                code:1002,
                msg:'The type is not allowed for uploading'
            })
            return
        }
        const filePath = resolve(__dirname,'./upload_temp/'+token+'_'+index+'.'+ALLOWED_TYPE[type])
        writeFileSync(filePath, file.data)
        res.send({
            code:0,
            msg:'success',
        })
        return
    }
    // const filePath = resolve(__dirname,'./upload_temp/'+fileName)
    // if(Number(uploadedSize) !== 0){
    //     if(!existsSync(filePath)){
    //         res.send({
    //             code:1003,
    //             msg:'The file is not exist'
    //         })
    //         return
    //     }
    //     appendFileSync(filePath, file.data)

    //     res.send({
    //         code:0,
    //         msg:'Appended',
    //         data: {
    //             url: 'http://localhost:8000/'+fileName
    //         }
    //     })
    //     return
    // }
    // writeFileSync(filePath,file.data)
})

app.listen(PORT,()=>{
    console.log('Server is running on ' + PORT)
})
