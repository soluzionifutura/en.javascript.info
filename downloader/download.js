const { readdirSync, readFileSync, writeFileSync } = require("fs")
const { join, parse, resolve } = require("path")
const { mdToPdf } = require("md-to-pdf")

const mdLinkRegex = /^\[([\w\s\d]+)\]\(((?:\/|https?:\/\/)[\w\d./?=#]+)\)$/

const dig = (filesOrFolders, breadcrumb, document) => {
    filesOrFolders.forEach(fileOrFolder => {
        const { base, ext } = parse(fileOrFolder)
        
        if (ext === ".md") {
            let data = readFileSync(fileOrFolder, "utf8")
            document.push({ 
                breadcrumb: [...breadcrumb, base].join(" - "),
                data
            })
        }
    })
    
    filesOrFolders.forEach(fileOrFolder => {
        try {
            const filesOrFolders = readdirSync(fileOrFolder)
            dig(filesOrFolders.map(e => join(fileOrFolder, e)), [...breadcrumb, parse(fileOrFolder).base], document)
        } catch(err) {
            if (err.code !== "ENOTDIR") {
                throw err
            }
        }
    })

    return document
}

void (async() => {
    const document = dig(["1-js", "5-network"].map(e => join(__dirname, "..", e)), [], [])
    const content = document.map(({ data, breadcrumb }) => `# ${breadcrumb}\n${data}`).join('<div class="page-break"></div>\n\n')
    await mdToPdf({ content }, {
        pdf_options: {
            format: "a4",
            margin: "30mm 20mm",
            printBackground: true
        },
        stylesheet: "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css",
        body_class: "markdown-body",
        css: `
            .page-break { page-break-after: always; }
            .markdown-body { font-size: 18px; }
            .markdown-body pre > code { white-space: pre-wrap; }
        `,
        content: document.slice(0, 3).map(({ data, breadcrumb }) => `# ${breadcrumb}\n${data}`).join('<div class="page-break"></div>\n\n'),
        dest: join(__dirname, "pdf", "javascript.pdf"),
        
    })
})().catch(console.error)
