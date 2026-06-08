import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { AppContext } from "../src/server/appContext.js";
import type { CliHubCommandResult, CliHubCommandRunner } from "../src/server/clihub/clihub.js";
import { createHttpApp } from "../src/server/http/app.js";
import { cleanup, testDir } from "./helpers.js";

let directory: string | null = null;
let context: AppContext | null = null;

afterEach(() => {
  context?.close();
  context = null;
  if (directory) cleanup(directory);
  directory = null;
});

describe("Project CLI API", () => {
  it("lists installed function and dependency CLI commands from CliHub", async () => {
    directory = testDir("project-cli-commands");
    const gitPath = "C:\\Program Files\\Git\\cmd\\git.exe";
    const ghPath = "C:\\Program Files\\GitHub CLI\\gh.exe";
    const runner = new FakeCliRunner({
      lookups: {
        git: [gitPath],
        gh: [ghPath]
      }
    });
    context = new AppContext(directory, { cliHub: { commandRunner: runner } });
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    fs.mkdirSync(projectRoot, { recursive: true });

    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot, includeSubdirectories: true })
      .expect(201);

    await request(app)
      .post("/api/clihub/discovery/refresh")
      .set("x-local-api-token", context.token)
      .send({ cliId: "git", includeDetails: false })
      .expect(200);
    await request(app)
      .post("/api/clihub/discovery/refresh")
      .set("x-local-api-token", context.token)
      .send({ cliId: "gh", includeDetails: false })
      .expect(200);

    const listed = await request(app)
      .get(`/api/projects/${added.body.project.id}/cli-actions`)
      .set("x-local-api-token", context.token)
      .expect(200);

    expect(listed.body.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cliId: "git",
          displayName: "Git",
          actions: [],
          commands: [
            expect.objectContaining({
              kind: "dependency",
              command: "git",
              commandText: "git",
              cwd: projectRoot,
              localPath: gitPath
            })
          ]
        }),
        expect.objectContaining({
          cliId: "gh",
          displayName: "GitHub CLI",
          actions: [],
          commands: [
            expect.objectContaining({
              kind: "function",
              command: "gh",
              commandText: "gh",
              cwd: projectRoot,
              localPath: ghPath
            })
          ]
        })
      ])
    );
  });

  it("lists and runs CodeGraph actions for the selected project group without requiring a real install", async () => {
    directory = testDir("project-cli-api");
    const codegraphPath = "C:\\tools\\codegraph.cmd";
    const runner = new FakeCliRunner();
    context = new AppContext(directory, { cliHub: { commandRunner: runner } });
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    const childRoot = path.join(projectRoot, "packages", "app");
    fs.mkdirSync(childRoot, { recursive: true });

    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot, includeSubdirectories: true })
      .expect(201);

    const empty = await request(app)
      .get(`/api/projects/${added.body.project.id}/cli-actions`)
      .query({ targetRootPath: childRoot })
      .set("x-local-api-token", context.token)
      .expect(200);
    expect(empty.body.groups).toEqual([]);

    const customCodeGraph = await request(app)
      .post("/api/clihub/custom/install-command")
      .set("x-local-api-token", context.token)
      .send({ installCommand: "npm install -g @colbymchenry/codegraph", displayName: "CodeGraph" })
      .expect(201);
    expect(customCodeGraph.body).toMatchObject({
      sourceType: "custom",
      commandNames: ["codegraph"],
      availabilityState: "unavailable"
    });

    const unavailable = await request(app)
      .get(`/api/projects/${added.body.project.id}/cli-actions`)
      .query({ targetRootPath: childRoot })
      .set("x-local-api-token", context.token)
      .expect(200);
    expect(unavailable.body.groups[0].availability).toMatchObject({
      state: "unavailable",
      cliHubCliId: customCodeGraph.body.cliId
    });

    runner.lookups.codegraph = [codegraphPath];
    runner.runs[`${codegraphPath} --version`] = { exitCode: 0, stdout: "codegraph 0.4.0", stderr: "" };
    runner.runs["codegraph status"] = { exitCode: 0, stdout: "Index is ready", stderr: "" };
    await request(app)
      .post("/api/clihub/discovery/refresh")
      .set("x-local-api-token", context.token)
      .send({ cliId: customCodeGraph.body.cliId })
      .expect(200);

    const listed = await request(app)
      .get(`/api/projects/${added.body.project.id}/cli-actions`)
      .query({ targetRootPath: childRoot })
      .set("x-local-api-token", context.token)
      .expect(200);
    expect(listed.body).toMatchObject({
      projectId: added.body.project.id,
      targetRootPath: childRoot,
      groups: [
        {
          cliId: customCodeGraph.body.cliId,
          displayName: "CodeGraph",
          availability: { state: "available" }
        }
      ]
    });
    expect(listed.body.groups[0].actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "codegraph:init",
          command: "codegraph",
          args: ["init", "-i"],
          cwd: childRoot,
          executionMode: "terminal",
          writesProject: true,
          affectedPaths: [path.join(childRoot, ".codegraph")]
        }),
        expect.objectContaining({
          actionId: "codegraph:status",
          args: ["status"],
          executionMode: "inline",
          writesProject: false
        })
      ])
    );

    const status = await request(app)
      .post(`/api/projects/${added.body.project.id}/cli-actions/${encodeURIComponent("codegraph:status")}/execute`)
      .set("x-local-api-token", context.token)
      .send({ targetRootPath: childRoot })
      .expect(200);
    expect(status.body).toMatchObject({
      actionId: "codegraph:status",
      cwd: childRoot,
      status: "success",
      exitCode: 0,
      stdout: "Index is ready"
    });

    const launched = await request(app)
      .post(`/api/projects/${added.body.project.id}/cli-actions/${encodeURIComponent("codegraph:init")}/execute`)
      .set("x-local-api-token", context.token)
      .send({ targetRootPath: childRoot, dryRun: true })
      .expect(200);
    expect(launched.body).toMatchObject({
      actionId: "codegraph:init",
      status: "launched",
      launch: {
        launched: true,
        command: { command: "codegraph", args: ["init", "-i"], cwd: childRoot }
      }
    });
    expect(runner.executed).toContain("codegraph status");
    expect(runner.executed).not.toContain("codegraph init -i");

    await request(app)
      .post(`/api/projects/${added.body.project.id}/cli-actions/${encodeURIComponent("codegraph:missing")}/execute`)
      .set("x-local-api-token", context.token)
      .send({ targetRootPath: childRoot })
      .expect(404);

    await request(app)
      .get(`/api/projects/${added.body.project.id}/cli-actions`)
      .query({ targetRootPath: path.join(directory, "outside") })
      .set("x-local-api-token", context.token)
      .expect(400);
  });
});

class FakeCliRunner implements CliHubCommandRunner {
  executed: string[] = [];
  readonly lookups: Record<string, string[]>;
  readonly runs: Record<string, CliHubCommandResult>;

  constructor(options: { lookups?: Record<string, string[]>; runs?: Record<string, CliHubCommandResult> } = {}) {
    this.lookups = options.lookups ?? {};
    this.runs = options.runs ?? {};
  }

  async lookup(commandName: string): Promise<string[]> {
    return this.lookups[commandName] ?? [];
  }

  async run(command: string, args: string[]): Promise<CliHubCommandResult> {
    const key = [command, ...args].join(" ");
    this.executed.push(key);
    return this.runs[key] ?? { exitCode: 0, stdout: "", stderr: "" };
  }
}
