const express = require('express')
const app = express()

const path = require('path')
const sqlite3 = require('sqlite3')

const {open} = require('sqlite')
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const objectSnakeToCamel = newObject => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  }
}

const districtSnakeToCamel = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}

const reportSnakeToCamel = newObject => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  }
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhot:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.get('/states/', async (request, response) => {
  const allStatesList = `
        SELECT 
        *
        FROM
        state
        ORDER BY state_id;`
  const statesList = await db.all(allStatesList)
  const statesResult = statesList.map(eachObject => {
    return objectSnakeToCamel(eachObject)
  })
  response.send(statesResult)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `
        select
            *
        from
        state
        where
        state_id=${stateId};`
  const newState = await db.get(getState)
  const stateResult = objectSnakeToCamel(newState)
  response.send(stateResult)
})

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createDistrict
  const NewDistrict = `
        INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths, )
        VALUES
            ('${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
            );`
  const addDistrict = await db.run(NewDistrict)
  const districtId = addDistrict.lastId
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrict = `
        select
            *
        from
        district
        where
        district_id=${districtId};`
  const newdistrict = await db.get(getdistrict)
  const districtResult = districtSnakeToCamel(newdistrict)
  response.send(districtResult)
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
        delete
        from
        district
        where
        district_id=${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`
  await db.run(UpdateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const GETQUERYSUM = `
        SELECT
            SUM(cases) AS cases,
            SUM(cured) AS cured,
            SUM(active) AS active,
            SUM(deaths) AS deaths
        FROM
        disrict
        WHERE
        state_id=${stateId};`
  const stateReport = await db.get(GETQUERYSUM)
  const resultReport = reportSnakeToCamel(stateReport)
  response.send(resultReport)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `
        select
        state_name
        from
        state
        on state.state_id = district.state_id
        where
        .district.district_id=${districtId};`
  const newdistrict = await db.get(getdistrictQuery)
  response.send({stateName: stateName.stateName.state_name})
})

module.exports = app
