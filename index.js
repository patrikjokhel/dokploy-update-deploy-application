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
		const username = core.getInput("registry-username", { required: false })
		if (username) {
			core.setSecret(username)
		}

		const password = core.getInput("registry-password", { required: false })
		if (password) {
			core.setSecret(password)
		}

		const name = core.getInput("name", { required: false }) || undefined
		const appName = core.getInput("app-name", { required: false }) || undefined
		const env = core.getInput("env", { required: false }) || undefined
		const previewEnv =
			core.getInput("preview-env", { required: false }) || undefined
		const memoryReservation =
			core.getInput("memory-reservation", { required: false }) || undefined
		const memoryLimit =
			core.getInput("memory-limit", { required: false }) || undefined
		const cpuReservation =
			core.getInput("cpu-reservation", { required: false }) || undefined
		const cpuLimit =
			core.getInput("cpu-limit", { required: false }) || undefined
		const registryUrl =
			core.getInput("registry-url", { required: false }) || undefined
		const dockerImage =
			core.getInput("docker-image", { required: false }) || undefined
		const title =
			core.getInput("deployment-title", { required: false }) || undefined
		const description =
			core.getInput("deployment-description", { required: false }) || undefined
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

		const updateParams = [
			name,
			appName,
			env,
			previewEnv,
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
		]
		if (updateParams.some((p) => p !== undefined)) {
			core.info(`Updating application '${applicationId}'...`)
			await makePostRequest(
				client,
				`${dokployUrl}/api/application.update`,
				{
					applicationId,
					...updateParams
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
