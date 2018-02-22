/** 
 * Convierte todos los .raml de una determinada carpeta en
 * su equivalente a .html.
*/

const raml2html = require('raml2html')
const fs = require('fs')
const path = require('path')

const pattern_start = '<!--@CONTENTSTART@-->'
const pattern_end = '<!--@CONTENTEND@-->'

const conf = {
	input: 'api',
	output: 'docs',
	ramlExt: '.raml',
	base: {
		file: 'index.html',
		pattern: new RegExp(`${pattern_start}[\\s\\S]*${pattern_end}`, 'ig')
	}
}

const configWithDefaultTheme = raml2html.getConfigForTheme()

async function render(ramlfile: string) {
	return await raml2html.render(ramlfile, configWithDefaultTheme);
}

async function save(dirname: string, contentfile: string) {
	return new Promise((resolve: Function, reject: Function) =>
		fs.writeFile(dirname, contentfile, (err) =>
			err ? reject(err) : resolve()
		)
	)
}

async function fillFileBase(file, content) {
	return new Promise((resolve: Function, reject: Function) => {
		fs.readFile(file, 'utf8', function (err, data) {
			if (err) return reject(err)

			let result = data.replace(conf.base.pattern, content);
			fs.writeFile(file, result, 'utf8', function (err) {
				return err? reject(err) : resolve()
			})
		})
	})
}

function includeIntoBase(ulList: string[]) {
	const li = (text: string, href: string) => `<li><a href="${href}">${text}</a></li>`
	let resHtml = ''
	for (const iterator of ulList) {
		resHtml += li(iterator, iterator)
	}
	resHtml = `
		${pattern_start}
		<ul>
			${resHtml}
		</ul>
		${pattern_end}
	`.trim()
	fillFileBase(conf.base.file, resHtml)
}

async function build() {
	let ul: string[] = []

	fs.readdir(conf.input, async (err, files: string[]) => {
		files = files.filter(f => path.extname(f) === conf.ramlExt)

		for (const file of files) {
			const out: string = path.join(conf.output, file.substring(0, file.length - conf.ramlExt.length).concat('.html'))
			const inputfile: string = path.join(conf.input, file)
			const html = await render(inputfile)
			await save(out, html)
			ul.push(out)
			console.log(`Rendered: ${file}`)
		}
		console.log(`${ul.length} files`)
		includeIntoBase(ul)
	})
}

build()
