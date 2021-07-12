const express = require('express')
const { MongoClient } = require('mongodb')
const app = express()
const { nanoid } = require('nanoid')
const cors = require('cors')
const mqtt = require('./mqtt.js')()

let db

const mongo = new MongoClient(process.env.MONGODB, {
    useUnifiedTopology: true
})
mongo.connect(err => {
    if (err) console.error(err)

    db = mongo.db(process.env.MONGODB_NAME)

    mqtt.handleInsert = values => {
        db.collection('values')
            .insertMany(values
                .map(v => ({ _id: nanoid(64), ...v })))
    }
})


app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    const { headers } = req
    if (headers.authorization && headers.authorization === process.env.AUTH) {
        next()
    } else {
        res.status(401).json({
            error: 'Unauthorized'
        })
    }
})

app.get('/values', async (req, res) => {
    res.json(await mqtt.requestValues())
})

app.post('/actions/relay', (req, res) => {
    mqtt.sendRelayRequest(req.body.value, undefined, err => {
        res.json({
            success: !err,
            error: err
        })
    })
})

app.get('/history', (req, res) => {
    const { from } = req.query
    db.collection('values').find({
        at: { $gt: Number(from) }
    }).toArray((err, docs) => {
        if (err) {
            return res.status(500).json({error: err})
        }
        res.json({
            data: docs.map(v => ([
                v.t, v.h, v.wt, v.w, v.at
            ].map(n => Number(n))))
        })
    })
})


const port = process.env.PORT || 80
app.listen(port, () => {
    console.log(`Example app listening at :${port}`)
})
