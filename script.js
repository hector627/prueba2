import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const path = "./CHANGELOG.md";

try {
	// Obtener etiqueta actual apartir de la variable de entorno de Git
	const currentTag = process.env.GITHUB_REF_NAME;
	const REPOSITORY_NAME = process.env.GITHUB_REPOSITORY;
	const GITHUB_URL = "https://github.com";
	const REPOSITORY = `${GITHUB_URL}/${REPOSITORY_NAME}`;

	// Obtener etiqueta previa
	let previousTag;

	try {
		previousTag = execSync(`git describe --abbrev=0 ${currentTag}^`)
			.toString()
			.trim();
	} catch {
		previousTag = "";
	}

	let range = previousTag ? `${previousTag}..${currentTag}` : currentTag;

	// Obtener arreglo de commits
	const format = "%H|%h|%s|%an";

	const rawOutput = execSync(
		`git log ${range} --pretty=format:"${format}"`
	).toString();

	const commits = rawOutput.split("\n").map(commit => {
		const [hash, abbrevHash, subject, author] = commit.split("|");

		return { hash, abbrevHash, subject, author };
	});

	// Ejecutar log (con el formato [Hash corto mensaje (autor)])
	const log = commits
		.map(c => {
			return `* [\`${c.abbrevHash}\`](${REPOSITORY}/commit/${c.hash}) ${c.subject} (${c.author})\n`;
		})
		.toString()
		.replaceAll(",*", "*");

	// Preparar la cabecera (v.1.1.1 - April 7, 2000)
	const date = new Date().toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});

	const newEntry = `${currentTag} - ${date}\n\n${log}\n\n`;

	// Obteniendo estado actual del archivo y haciendo un "prepend"
	const currentContent = readFileSync(path, "utf-8");
	writeFileSync(path, newEntry + currentContent);

	console.log(`Changelog actualizado para la versión ${currentTag}`);
} catch (err) {
	console.log(`Error al generar Changelog: ${err.message}`);
	process.exit(1);
}
