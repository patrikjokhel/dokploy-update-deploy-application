const core = require("@actions/core")
const github = require("@actions/github")
const httpm = require("@actions/http-client")

/**
 * Parse a string input as an integer
 * @param {string} value - The input value
 * @param {string} name - The input name (for error messages)
 * @returns {number|undefined}
 */
function parseIntInput(value, name) {
	if (!value || value === "") {
		return undefined
	}
	const parsed = parseInt(value, 10)
	if (isNaN(parsed)) {
		throw new Error(`${name} must be a valid number, got: ${value}`)
	}
	return parsed
}

/**
 * Parse a string input as a boolean
 * @param {string} value - The input value
 * @returns {boolean|undefined}
 */
function parseBooleanInput(value) {
	if (!value || value === "") {
		return undefined
	}
	const lower = value.toLowerCase()
	if (lower === "true") return true
	if (lower === "false") return false
	throw new Error(`Expected 'true' or 'false', got: ${value}`)
}

/**
 * Parse an optional string input
 * @param {string} key - The input key
 * @returns {string|undefined}
 */
function parseOptionalStringInput(key) {
	return core.getInput(key, { required: false }) || undefined
}

/**
 * Make a POST request to the given URL with the given body
 * @param {httpm.HttpClient} client
 * @param {string} url
 * @param {any} body
 * @param {string} operation
 * @returns {Promise<httpm.HttpClientResponse>}
 */
async function makePostRequest(client, url, body, operation) {
	core.debug(`${operation}: ${url}`)
	core.debug(`request body: ${JSON.stringify(body, null, 2)}`)

	const response = await client.postJson(url, body)
	core.debug(`response status: ${response.statusCode}`)
	if (response.statusCode !== 200) {
		const errorMessage =
			response.message || response.errorMessage || response.statusCode
		throw new Error(
			`${operation} failed with status code ${response.statusCode}: ${errorMessage}`
		)
	}

	return response
}

async function run() {
	try {
		const dokployUrl = core
			.getInput("dokploy-url", { required: true })
			.replace(/\/$/, "") // Remove trailing slash
		const dokployAPIKey = core.getInput("api-key", { required: true })
		const applicationId = core.getInput("application-id", { required: true })

		// Mask secrets
		core.setSecret(dokployAPIKey)
		const username = parseOptionalStringInput("registry-username")
		if (username) {
			core.setSecret(username)
		}

		const password = parseOptionalStringInput("registry-password")
		if (password) {
			core.setSecret(password)
		}

		const name = parseOptionalStringInput("name")
		const env = parseOptionalStringInput("env")
		const memoryReservation = parseOptionalStringInput("memory-reservation")
		const memoryLimit = parseOptionalStringInput("memory-limit")
		const cpuReservation = parseOptionalStringInput("cpu-reservation")
		const cpuLimit = parseOptionalStringInput("cpu-limit")
		const registryUrl = parseOptionalStringInput("registry-url")
		const dockerImage = parseOptionalStringInput("docker-image")
		const title = parseOptionalStringInput("deployment-title")
		const description = parseOptionalStringInput("deployment-description")
		const replicas = parseIntInput(
			core.getInput("replicas", { required: false }),
			"replicas"
		)
		const rollbackActive = parseBooleanInput(
			core.getInput("rollback-active", {
				required: false
			})
		)

		const client = new httpm.HttpClient(
			"dokploy-redeploy-application",
			undefined,
			{
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"x-api-key": dokployAPIKey
				}
			}
		)

		const updateParams = {
			name,
			env,
			rollbackActive,
			memoryReservation,
			memoryLimit,
			cpuReservation,
			cpuLimit,
			registryUrl,
			username,
			password,
			dockerImage,
			replicas
		}

		const filteredUpdateParams = Object.keys(updateParams).reduce(
			(acc, key) => {
				if (updateParams[key] !== undefined) {
					acc[key] = updateParams[key]
				}
				return acc
			},
			{}
		)

		if (Object.keys(filteredUpdateParams).length > 0) {
			core.info(`Updating application '${applicationId}'...`)
			await makePostRequest(
				client,
				`${dokployUrl}/api/application.update`,
				{
					applicationId,
					...filteredUpdateParams
				},
				"updating application"
			)

			core.info(`Application '${applicationId}' updated.`)
		} else {
			core.info("No update parameters provided, skipping update.")
		}

		core.info(`Deploying application '${applicationId}'...`)
		await makePostRequest(
			client,
			`${dokployUrl}/api/application.deploy`,
			{
				applicationId,
				title,
				description
			},
			"deploying application"
		)
		core.info(`Application '${applicationId}' deployed.`)
		core.setOutput("application-id", applicationId)
	} catch (error) {
		core.setFailed(error.message)
		core.debug(error.stack)
	}
}

module.exports = run

if (require.main === module) {
	run()
}
