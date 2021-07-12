const MqttClient = require('mqtt')


class Mqtt {
    constructor(url) {
        this.client = MqttClient.connect(url)
        this.client.on('connect', () => this.onConnect())
        this.client.on('message', (t, m) => this.onMessage(t, m))

        this.dataCache = []

        this.handleInsert = () => console.log('Handle insert not implemented')

        this.valuesCallbacks = []
    }

    onConnect() {
        this.client.subscribe('weatherLite/data')
    }

    onMessage(topic, message) {
        switch (topic) {
            case 'weatherLite/data':
                this.handleData(message)
                break
        }
    }

    handleData(message) {
        const [t, h, wt, w] = message.toString().split(', ').map(v => Number(v))
        this.dataCache.push({
            t, h, wt, w, at: new Date().getTime()
        })

        for (const cb of this.valuesCallbacks) {
            cb(this.formatValues([t, h, wt, w]))
        }

        console.log('New data:', message.toString())

        if (this.dataCache.length > 5) {
            this.handleInsert([...this.dataCache])
            this.dataCache = []
        }
    }

    requestValues() {
        return new Promise(res => {
            this.valuesCallbacks.push(res)

            this.client.publish('weatherLite/getCurrentData', 'a')
        })
    }

    sendRelayRequest(value) {
        this.client.publish('weatherLite/relay', value ? '1' : '0')
    }

    formatValues([t, h, wt, w]) {
        return {
            temperature: t,
            humidity: h,
            water_temperature: wt,
            rain: w
        }
    }
}


module.exports = () => {
    return new Mqtt(process.env.MQTT_SERVER)
}