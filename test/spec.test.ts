import path from "path"
import { fromPath, SpecPath } from "../lib-js/spec-path"
import { runSpec } from "../lib-js/spec"
import { mockCompiler } from "./fixtures/mock-compiler"

const baseOpts = {
  impl: "sass-mock",
  compiler: mockCompiler,
  cmdArgs: [`${path.resolve(__dirname, "fixtures/sass-exec-mock.js")}`],
  rootDir: path.resolve(__dirname, "fixtures"),
}

describe("runSpec", () => {
  let dir: SpecPath
  beforeAll(async () => {
    dir = await fromPath(path.resolve(__dirname, "fixtures/spec.hrx"))
    await dir.writeToDisk()
  })

  afterAll(async () => {
    await dir.cleanup()
  })

  async function runAtPath(subpath: string, opts?: any) {
    const subdir = await dir.atPath(subpath)
    return await runSpec(subdir, { ...baseOpts, ...opts })
  }

  describe("success cases", () => {
    it("passes if the outputs match", async () => {
      expect(await runAtPath("output/pass")).toMatchObject({ type: "pass" })
    })

    it("fails if the outputs are mismatched", async () => {
      expect(await runAtPath("output/fail-mismatch")).toMatchObject({
        type: "fail",
      })
    })

    it("fails if the spec throws an error", async () => {
      expect(await runAtPath("output/fail-error")).toMatchObject({
        type: "fail",
      })
    })
  })

  describe("error cases", () => {
    it("passes when the errors match", async () => {
      expect(await runAtPath("error/pass")).toMatchObject({ type: "pass" })
    })

    it("fails on mismatched errors", async () => {
      expect(await runAtPath("error/fail-mismatch")).toMatchObject({
        type: "fail",
      })
    })

    it("fails if the test case passes", async () => {
      expect(await runAtPath("error/fail-mismatch")).toMatchObject({
        type: "fail",
      })
    })
  })

  describe("warning cases", () => {
    it("passes when the warnings match", async () => {
      expect(await runAtPath("warning/pass")).toMatchObject({ type: "pass" })
    })

    it("fails when the warnings are different", async () => {
      expect(await runAtPath("warning/mismatch")).toMatchObject({
        type: "fail",
      })
    })

    it("fails when expected warning is missing", async () => {
      expect(await runAtPath("warning/missing")).toMatchObject({ type: "fail" })
    })

    it("fails when extraneous warning is present", async () => {
      expect(await runAtPath("warning/extraneous")).toMatchObject({
        type: "fail",
      })
    })

    it("skips warning checks if :warning_todo option enabled", async () => {
      expect(await runAtPath("warning/todo")).toMatchObject({ type: "pass" })
    })

    it("runs warning check if `:warning_todo` is enabled but --run-todo is chosen", async () => {
      expect(
        await runAtPath("warning/todo", { todoMode: "run" })
      ).toMatchObject({ type: "fail" })
    })
  })

  describe("ignore", () => {
    it("marks a test as `skip` if the `:ignore_for` option enabled", async () => {
      expect(await runAtPath("ignore")).toMatchObject({ type: "skip" })
    })
  })

  describe("todo", () => {
    it("marks a test as `todo` when the `:todo` option is set", async () => {
      expect(await runAtPath("todo/fail")).toMatchObject({ type: "todo" })
    })

    it("runs todos if --run-todo is set", async () => {
      expect(await runAtPath("todo/fail", { todoMode: "run" })).toMatchObject({
        type: "fail",
      })
    })

    it("marks a failing todo case as `todo` if --probe-todo is set", async () => {
      expect(
        await runAtPath("todo/fail", { todoMode: "probe" })
      ).toMatchObject({ type: "todo" })
    })

    it("marks a passing todo case as a failure when --probe-todo is set", async () => {
      expect(
        await runAtPath("todo/pass", { todoMode: "probe" })
      ).toMatchObject({ type: "fail" })
    })
  })
})
