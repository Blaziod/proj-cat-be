import Express from 'express'
import env from 'dotenv'
import morgan from 'morgan'
import logger, {loggerMiddleware} from './utils/logger.js'
import authRouter from './routers/auth.js'
import { readstatic } from './utils/index.js'
import * as db from './db/index.js'

// RUN CONFIGS
logger.info("Running Configurations...")
env.config()
db.setupAndStart()

const app = Express()

app.use(Express.urlencoded({ extended: true }))
app.use(Express.json())
app.use(loggerMiddleware())
// ROUTE HANDLERS
app.use('/api/auth/', authRouter)

app.get('/', (_, res) => {
	res.send(readstatic('home.html'))
})

// Start http server
logger.info("Starting HTTP server...")
app.listen(5000, () => {
	logger.info('Server listening on port 5000')
})
