const run = require("./index")

// Mock dependencies
jest.mock("@actions/core")
jest.mock("@actions/github")
jest.mock("@actions/http-client")

const core = require("@actions/core")
const httpm = require("@actions/http-client")

describe("Dokploy Update Deploy Application", () => {
	let mockHttpClient
	let mockPostJson
	let mockSetFailed

	beforeEach(() => {
		jest.clearAllMocks()

		mockPostJson = jest.fn().mockResolvedValue({
			statusCode: 200,
			result: {}
		})

		mockHttpClient = {
			postJson: mockPostJson
		}

		httpm.HttpClient = jest.fn().mockReturnValue(mockHttpClient)

		core.getInput = jest.fn().mockImplementation((key, _options) => {
			const inputs = {
				"dokploy-url": "https://test.dokploy.com",
				"api-key": "test-api-key",
				"application-id": "test-app-id"
			}
			return inputs[key] || ""
		})

		mockSetFailed = jest.fn()

		core.setSecret = jest.fn()
		core.info = jest.fn()
		core.debug = jest.fn()
		core.setOutput = jest.fn()
		core.setFailed = mockSetFailed
	})

	test("should use proper parameter names as keys in update request body", async () => {
		core.getInput = jest.fn().mockImplementation((key, _options) => {
			const inputs = {
				"dokploy-url": "https://test.dokploy.com",
				"api-key": "test-api-key",
				"application-id": "test-app-id",
				name: "new-app-name",
				env: 'NODE_ENV="production"\nPORT=8080\n',
				replicas: "3"
			}
			return inputs[key] || ""
		})

		await run()

		expect(mockSetFailed).not.toHaveBeenCalled()
		expect(mockPostJson).toHaveBeenCalledTimes(2) // update + deploy

		const updateCall = mockPostJson.mock.calls[0]
		const updateRequestBody = updateCall[1]

		expect(updateRequestBody).toHaveProperty("applicationId", "test-app-id")
		expect(updateRequestBody).toHaveProperty("name", "new-app-name")
		expect(updateRequestBody).toHaveProperty(
			"env",
			'NODE_ENV="production"\nPORT=8080\n'
		)
		expect(updateRequestBody).toHaveProperty("replicas", 3) // parsed as int

		// Optional parameters that weren't provided should not be present
		expect(updateRequestBody).not.toHaveProperty("registryUrl")
		expect(updateRequestBody).not.toHaveProperty("registryUsername")
		expect(updateRequestBody).not.toHaveProperty("registryPassword")
		expect(updateRequestBody).not.toHaveProperty("dockerImage")
	})

	test("should not make update request when no update parameters are provided", async () => {
		core.getInput = jest.fn().mockImplementation((key, _options) => {
			const inputs = {
				"dokploy-url": "https://test.dokploy.com",
				"api-key": "test-api-key",
				"application-id": "test-app-id"
			}
			return inputs[key] || ""
		})

		await run()

		expect(mockPostJson).toHaveBeenCalledTimes(1) // only deploy

		const deployCall = mockPostJson.mock.calls[0]
		expect(deployCall[0]).toBe(
			"https://test.dokploy.com/api/application.deploy"
		)
	})
})

