import React, { useEffect, useRef, useState } from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Button, Card, CardActions, CardContent, CircularProgress, Grid, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import ThermostatIcon from '@material-ui/icons/Thermostat';
import OpacityRoundedIcon from '@material-ui/icons/OpacityRounded';
import WaterRoundedIcon from '@material-ui/icons/WaterRounded';
import WeatherPouringIcon from 'mdi-material-ui/WeatherPouring'
import RefreshIcon from '@material-ui/icons/Refresh';
import Chart from 'chart.js/auto'
import moment from 'moment'

export default function Index() {

  const [currentValue, setCurrentValue] = useState(null)
  const [history, setHistory] = useState(null)

  useEffect(() => {
    refresh()
    getHistory()
  }, [])

  const refresh = () => {
    setCurrentValue(null)
    fetch(`${process.env.GATSBY_API_URL}/values`, {
      headers: {
        'content-type': 'application/json',
        authorization: process.env.GATSBY_API_AUTH
      }
    })
      .then(r => r.json())
      .then(d => {
        console.log(d)
        setCurrentValue(d)
      })
  }

  const getHistory = () => {
    const from = new Date().getTime() - (2 * 24 * 60 * 60 * 1000)
    fetch(`${process.env.GATSBY_API_URL}/history?from=${from}`, {
      headers: {
        'content-type': 'application/json',
        authorization: process.env.GATSBY_API_AUTH
      }
    })
      .then(r => r.json())
      .then(d => {
        console.log(d)
        setHistory(d)
      })
  }

  const changeRelayState = (value) => () => {
    fetch(`${process.env.GATSBY_API_URL}/actions/relay`, {
      headers: {
        'content-type': 'application/json',
        authorization: process.env.GATSBY_API_AUTH
      },
      method: 'post',
      body: JSON.stringify({ value })
    })
      .then(r => r.json())
      .then(d => {
        console.log(d)
      })
  }

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Weather station lite
        </Typography>
        <Card>
          <CardContent>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h5" component="div">
                  Valores atuais
                </Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={refresh}>
                  <RefreshIcon />
                </IconButton>
              </Grid>
            </Grid>
            {
              currentValue
                ? <Values values={currentValue} />
                : <Grid container justifyContent="center">
                  <Grid item>
                    <CircularProgress size={24} />
                  </Grid>
                </Grid>
            }
          </CardContent>
        </Card>

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Bomba d'água
            </Typography>
            <Grid container justifyContent="center" alignItems="center" spacing={2}>
              <Grid item>
                <Button variant="contained" color="success" onClick={changeRelayState(true)}>
                  Ligar
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" color="error" onClick={changeRelayState(false)}>
                  Desligar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>


        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Histórico
            </Typography>
            {
              history
                ? <HistoryChart data={history} />
                : <Grid container justifyContent="center">
                  <Grid item>
                    <CircularProgress size={24} />
                  </Grid>
                </Grid>
            }
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}


function Values({ values }) {
  const {
    temperature,
    humidity,
    water_temperature: waterTemperature,
    rain
  } = values

  const getColorByTemp = (t) => t > 25 ? '#ffb333' : '#66cfff'

  return <Grid container>
    <Grid item xs={12} sm={6}>
      <List dense>
        <ListItem>
          <ListItemIcon>
            <ThermostatIcon sx={{ color: getColorByTemp(temperature) }} />
          </ListItemIcon>
          <ListItemText primary={`${temperature} ℃`} secondary="Temperatura" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <OpacityRoundedIcon />
          </ListItemIcon>
          <ListItemText primary={`${humidity} %`} secondary="Humidade" />
        </ListItem>
      </List>
    </Grid>
    <Grid item xs={12} sm={6}>
      <List dense>
        <ListItem>
          <ListItemIcon>
            <WaterRoundedIcon sx={{ color: getColorByTemp(waterTemperature) }} />
          </ListItemIcon>
          <ListItemText primary={`${waterTemperature} ℃`} secondary="Temperatura da água" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <WeatherPouringIcon />
          </ListItemIcon>
          <ListItemText primary={`${(rain / 1024).toFixed(2)} %`} secondary="Chuva" />
        </ListItem>
      </List>
    </Grid>
  </Grid>
}

function HistoryChart({data}) {
  data = data.data
  const tempRef = useRef()
  const humRef = useRef()

  useEffect(() => {
    const config = {
      type: 'line',
      data: {
        labels: data.map(v => moment(v[4]).format('D HH:mm')),
        datasets: [{
          label: 'Temperatura',
          data: data.map(v => v[0]),
          borderColor: '#ffb333',
          fill: false,
          tension: 0.3,
          pointStyle: 'line'
        },
        {
          label: 'Temperatura da água',
          data: data.map(v => v[2]),
          borderColor: '#66cfff',
          fill: false,
          tension: 0.3,
          pointStyle: 'line'
        }]
      },
      options: {}
    }

    new Chart(
      tempRef.current,
      config
    )
  }, [])

  useEffect(() => {
    const config = {
      type: 'line',
      data: {
        labels: data.map(v => moment(v[4]).format('D HH:mm')),
        datasets: [{
          label: 'Humidade',
          data: data.map(v => v[1]),
          borderColor: '#66cfff',
          fill: false,
          tension: 0.3,
          pointStyle: 'line'
        }]
      },
      options: {}
    }

    new Chart(
      humRef.current,
      config
    )
  }, [])

  return <div>
    <Typography>
      Temperatura
    </Typography>
    <canvas ref={tempRef}></canvas>
    <Typography>
      Humidade
    </Typography>
    <canvas ref={humRef}></canvas>
  </div>

}
