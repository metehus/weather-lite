#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Arduino_JSON.h>
#include "Env.h"

#define DHT_PIN D5
#define DS18B20_PIN D1
#define WATER_SENSOR_PIN A0
#define RELAY_PIN 13

#define UPDATE_INTERVAL 60000 // ms
// #define UPDATE_INTERVAL 3000        // ms

DHT dht(DHT_PIN, DHT11);

OneWire oneWire(DS18B20_PIN);
DallasTemperature waterTempSensor(&oneWire);

unsigned long lastTime = 0;

WiFiClient wifi;
PubSubClient client(wifi);

bool started = false;

void setup()
{
    Serial.begin(9600);

    pinMode(WATER_SENSOR_PIN, INPUT);

    dht.begin();
    waterTempSensor.begin();

    pinMode(RELAY_PIN, OUTPUT);
}

void loop()
{
    if (!started)
    {
        digitalWrite(RELAY_PIN, HIGH);
        started = true;

        connect();
    }

    if (!client.connected())
        connectMqtt();

    if (!client.loop())
        client.connect(DEVICE_NAME);

    if ((millis() - lastTime) > UPDATE_INTERVAL)
    {
        sendData();
        lastTime = millis();
    }
}

void connect()
{
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    WiFi.hostname(DEVICE_NAME);

    Serial.print("Connecting to ");
    Serial.println(WIFI_SSID);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(600);
        Serial.print(".");
    }
    Serial.println("");
    Serial.print("Connected to WiFi network with IP Address: ");
    Serial.println(WiFi.localIP());

    client.setServer(MQTT_SERVER, 1883);
    client.setCallback(mqttCallback);
}

void connectMqtt()
{
    while (!client.connected())
    {
        Serial.println("Attempting MQTT connection...");
        if (client.connect(DEVICE_NAME))
        {
            Serial.println("Connected to MQTT Server");
            client.subscribe("weatherLite/relay");
            client.subscribe("weatherLite/getCurrentData");
        }
        else
        {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(". Trying again in 5 seconds");
            delay(5000);
        }
    }
}

void sendData()
{
    String data = getData();

    client.publish("weatherLite/data", data.c_str());
}

String getData()
{
    float dhtTemp = dht.readTemperature();
    float dhtHumidity = dht.readHumidity();

    waterTempSensor.requestTemperatures();
    float waterTemp = waterTempSensor.getTempCByIndex(0);

    int waterSensor = analogRead(WATER_SENSOR_PIN);

    String sep = ", ";

    return String(dhtTemp) + sep + String(dhtHumidity) + sep + String(waterTemp) + sep + String(waterSensor);
}


void mqttCallback (String topic, byte* _message, unsigned int length) {
    Serial.print("New MQTT Message from topic ");
    Serial.println(topic);

    String message;

    for (int i = 0; i < length; i++) {
        message += (char)_message[i];
    }

    if (topic == "weatherLite/relay") {
        runRelayAction(message);
    } else if (topic == "weatherLite/getCurrentData") {
        sendData();
    }
}

void runRelayAction(String message) {
    bool isOn = message == "1";
    digitalWrite(RELAY_PIN, isOn ? LOW : HIGH);
}