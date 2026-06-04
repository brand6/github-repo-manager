import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { AppContext } from "../src/server/appContext.js";
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

describe("SkillHub API", () => {
  it("returns default config, persists root updates, and imports local skills", async () => {
    directory = testDir("skillhub-api");
    context = new AppContext(directory);
    const app = await createHttpApp(context, { dev: false, serveClient: false });

    const defaults = await request(app).get("/api/skillhub").set("x-local-api-token", context.token).expect(200);
    expect(defaults.body.config.rootDir).toBe(path.join(directory, "skillhub"));
    expect(defaults.body.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "mattpocock-skills", type: "github", label: "mattpocock/skills" }),
        expect.objectContaining({ id: "skills", type: "local", label: "skills" })
      ])
    );
    expect(defaults.body.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ folderName: "tdd", sourceId: "mattpocock-skills" }),
        expect.objectContaining({ folderName: "unity-mcp-skill", sourceId: "skills" })
      ])
    );

    const nextRoot = path.join(directory, "custom-skillhub");
    const updated = await request(app)
      .patch("/api/config")
      .set("x-local-api-token", context.token)
      .send({ skillhub: { rootDir: nextRoot } })
      .expect(200);
    expect(updated.body.skillhub.rootDir).toBe(nextRoot);

    const localSkill = path.join(directory, "local", "review");
    fs.mkdirSync(localSkill, { recursive: true });
    fs.writeFileSync(path.join(localSkill, "SKILL.md"), "---\nname: review\ndescription: API import\n---\n", "utf8");
    const imported = await request(app)
      .post("/api/skillhub/import/local")
      .set("x-local-api-token", context.token)
      .send({ path: localSkill })
      .expect(200);

    expect(imported.body.imported[0]).toMatchObject({ folderName: "review", libraryRelativePath: "skills/review" });
    expect(imported.body.source).toMatchObject({ id: "skills", label: "skills", type: "local" });
    expect(fs.existsSync(path.join(nextRoot, "library", "skills", "review", "SKILL.md"))).toBe(true);

    const listed = await request(app).get("/api/skillhub").set("x-local-api-token", context.token).expect(200);
    expect(listed.body.sources).toEqual(expect.arrayContaining([expect.objectContaining({ id: "skills", label: "skills", type: "local" })]));
    const review = listed.body.skills.find((skill: { folderName: string }) => skill.folderName === "review");
    expect(review?.source).toMatchObject({ id: "skills", label: "skills", type: "local" });
  });

  it("lists and migrates project local skills through the API", async () => {
    directory = testDir("skillhub-api-local-skills");
    context = new AppContext(directory);
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    const localSkill = path.join(projectRoot, ".codex", "skills", "review");
    fs.mkdirSync(localSkill, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, "AGENTS.md"), "rules", "utf8");
    fs.writeFileSync(path.join(localSkill, "SKILL.md"), "---\nname: review\ndescription: Local skill\n---\n", "utf8");
    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot })
      .expect(201);

    const listed = await request(app)
      .get(`/api/projects/${added.body.project.id}/local-skills`)
      .set("x-local-api-token", context.token)
      .expect(200);

    expect(listed.body.skills[0]).toMatchObject({ type: "local", toolId: "codex", folderName: "review" });

    const migrated = await request(app)
      .post(`/api/projects/${added.body.project.id}/local-skills/migrate`)
      .set("x-local-api-token", context.token)
      .send({ toolId: "codex", folderName: "review" })
      .expect(200);

    expect(migrated.body).toMatchObject({ action: "migrated", requiresConfirmation: false, skill: { folderName: "review" } });
    expect(fs.lstatSync(localSkill).isSymbolicLink()).toBe(true);
  });

  it("migrates project local skills into a new local source through the API", async () => {
    directory = testDir("skillhub-api-local-skills-new-source");
    context = new AppContext(directory);
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    const localSkill = path.join(projectRoot, ".codex", "skills", "review");
    const targetSource = path.join(directory, "team-source");
    fs.mkdirSync(localSkill, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, "AGENTS.md"), "rules", "utf8");
    fs.writeFileSync(path.join(localSkill, "SKILL.md"), "---\nname: review\ndescription: Local skill\n---\n", "utf8");
    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot })
      .expect(201);

    const migrated = await request(app)
      .post(`/api/projects/${added.body.project.id}/local-skills/migrate`)
      .set("x-local-api-token", context.token)
      .send({ toolId: "codex", folderName: "review", target: { type: "new-source", path: targetSource } })
      .expect(200);

    expect(migrated.body).toMatchObject({
      action: "migrated",
      requiresConfirmation: false,
      skill: { folderName: "review", libraryRelativePath: "team-source/skills/review" }
    });
    expect(fs.existsSync(path.join(targetSource, "skills", "review", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(directory, "skillhub", "library", "team-source", "skills", "review", "SKILL.md"))).toBe(true);
    expect(fs.lstatSync(localSkill).isSymbolicLink()).toBe(true);
  });

  it("lists and migrates child directory local skills through the project API", async () => {
    directory = testDir("skillhub-api-child-local-skills");
    context = new AppContext(directory);
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    const childRoot = path.join(projectRoot, "packages", "app");
    const localSkill = path.join(childRoot, ".codex", "skills", "review");
    fs.mkdirSync(localSkill, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, "AGENTS.md"), "rules", "utf8");
    fs.writeFileSync(path.join(localSkill, "SKILL.md"), "---\nname: review\ndescription: Child local skill\n---\n", "utf8");
    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot, includeSubdirectories: true })
      .expect(201);

    const listed = await request(app)
      .get(`/api/projects/${added.body.project.id}/local-skills`)
      .query({ targetRootPath: childRoot })
      .set("x-local-api-token", context.token)
      .expect(200);

    expect(listed.body.skills[0]).toMatchObject({ type: "local", toolId: "codex", folderName: "review", skillPath: localSkill });

    const migrated = await request(app)
      .post(`/api/projects/${added.body.project.id}/local-skills/migrate`)
      .set("x-local-api-token", context.token)
      .send({ targetRootPath: childRoot, toolId: "codex", folderName: "review" })
      .expect(200);

    expect(migrated.body).toMatchObject({ action: "migrated", requiresConfirmation: false, localSkill: { skillPath: localSkill } });
    expect(fs.lstatSync(localSkill).isSymbolicLink()).toBe(true);
  });

  it("previews and creates a CLAUDE.md rule file through the project API", async () => {
    directory = testDir("skillhub-api-rule-template");
    context = new AppContext(directory);
    const app = await createHttpApp(context, { dev: false, serveClient: false });
    const projectRoot = path.join(directory, "repo");
    fs.mkdirSync(projectRoot, { recursive: true });
    const added = await request(app)
      .post("/api/projects")
      .set("x-local-api-token", context.token)
      .send({ rootPath: projectRoot })
      .expect(201);

    const preview = await request(app)
      .post(`/api/projects/${added.body.project.id}/rule-sync/create-preview`)
      .set("x-local-api-token", context.token)
      .send({ file: "CLAUDE.md", source: "template" })
      .expect(200);

    expect(preview.body).toMatchObject({ file: "CLAUDE.md", source: "template", sourceFile: null });
    expect(preview.body.content).toContain("## 2. Simplicity First");

    const editedContent = "# CLAUDE.md\n\nAPI edited\n";
    const created = await request(app)
      .post(`/api/projects/${added.body.project.id}/rule-sync/create`)
      .set("x-local-api-token", context.token)
      .send({ file: "CLAUDE.md", content: editedContent })
      .expect(200);

    expect(created.body).toMatchObject({ file: "CLAUDE.md", action: "created", status: { files: { "CLAUDE.md": { exists: true } } } });
    expect(fs.readFileSync(path.join(projectRoot, "CLAUDE.md"), "utf8")).toBe(editedContent);

    await request(app)
      .post(`/api/projects/${added.body.project.id}/rule-sync/create`)
      .set("x-local-api-token", context.token)
      .send({ file: "CLAUDE.md", content: "again" })
      .expect(400);
  });
});
