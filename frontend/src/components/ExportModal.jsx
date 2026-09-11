import { useMemo } from 'react'
import Modal from './Modal'
import { useToast } from './Toast'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
} from 'docx'
import { saveAs } from 'file-saver'

function formatExportHTML(axes, companyName, year) {
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>OKR - ${companyName} - ${year}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a1a; line-height: 1.6; }
  h1 { color: #0f639d; border-bottom: 2px solid #0f639d; padding-bottom: 8px; font-size: 22px; }
  h2 { color: #0f639d; font-size: 18px; margin-top: 28px; }
  h3 { color: #333; font-size: 15px; margin-top: 18px; }
  .axis { margin-bottom: 24px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
  .axis-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .axis-name { font-size: 18px; font-weight: bold; color: #0f639d; }
  .axis-progress { font-size: 16px; font-weight: bold; color: #0f639d; }
  .objective { margin-bottom: 14px; padding: 12px; background: #f8fafb; border-radius: 6px; border: 1px solid #eee; }
  .obj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .obj-label { font-size: 13px; font-weight: 600; color: #0f639d; background: #0f639d20; padding: 2px 8px; border-radius: 4px; }
  .obj-progress { font-size: 14px; font-weight: bold; color: #0f639d; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  th { background: #f0f4f8; text-align: left; padding: 8px 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  .status-done { color: #16a34a; font-weight: 600; }
  .status-progress { color: #2563eb; font-weight: 600; }
  .progress-bar { display: inline-block; width: 80px; height: 8px; background: #e5e7eb; border-radius: 4px; vertical-align: middle; margin-right: 6px; }
  .progress-fill { display: block; height: 8px; background: #0f639d; border-radius: 4px; }
  .initiative { padding: 4px 0; font-size: 13px; }
  .initiative-done { text-decoration: line-through; color: #888; }
  .users { color: #666; font-size: 12px; }
  .no-data { color: #999; font-style: italic; font-size: 13px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
  @media print { body { margin: 20px; } .axis { break-inside: avoid; } }
</style>
</head>
<body>
<h1>OKR - ${companyName} - ${year}</h1>
`

  if (!axes || axes.length === 0) {
    html += '<p class="no-data">Nenhum dado disponível.</p>'
  } else {
    axes.forEach((axis) => {
      const axisProgress = axis.objectives.length > 0
        ? Math.round(
            axis.objectives.reduce(
              (acc, o) => acc + (o.actions.length ? o.actions.reduce((s, a) => s + a.progress, 0) / o.actions.length : 0),
              0,
            ) / axis.objectives.length,
          )
        : 0

      html += `<div class="axis">
  <div class="axis-header">
    <span class="axis-name">Eixo: ${axis.name}</span>
    <span class="axis-progress">${axisProgress}%</span>
  </div>`

      if (axis.objectives.length === 0) {
        html += '\n  <p class="no-data">Nenhum Objetivo cadastrado.</p>'
      } else {
        axis.objectives.forEach((objective, objIdx) => {
          const objProgress = objective.actions.length
            ? Math.round(objective.actions.reduce((s, a) => s + a.progress, 0) / objective.actions.length)
            : 0

          html += `\n  <div class="objective">
    <div class="obj-header">
      <span><span class="obj-label">OBJ-${String(objIdx + 1).padStart(2, '0')}</span> ${objective.name}</span>
      <span class="obj-progress">${objProgress}%</span>
    </div>`

          if (objective.actions.length === 0) {
            html += '\n    <p class="no-data">Nenhum Key Result cadastrado.</p>'
          } else {
            html += `\n    <table>
      <thead><tr><th>Key Result</th><th>Status</th><th>Progresso</th><th>Equipe</th><th>Iniciativas</th></tr></thead>
      <tbody>`

            objective.actions.forEach((action) => {
              const isDone = action.progress === 100
              const statusClass = isDone ? 'status-done' : 'status-progress'
              const statusText = isDone ? 'Concluído' : 'Em andamento'
              const users = action.users?.map((u) => u.name).join(', ') || '-'
              const initiatives = action.initiatives?.length > 0
                ? action.initiatives.map((i) => {
                    const cls = i.completed ? 'initiative-done' : ''
                    const icon = i.completed ? '\u2713' : '\u25CB'
                    return `<div class="initiative ${cls}">${icon} ${i.name}</div>`
                  }).join('')
                : '<span class="no-data">Nenhuma</span>'

              html += `\n      <tr>
        <td><strong>${action.name}</strong></td>
        <td class="${statusClass}">${statusText}</td>
        <td>
          <span class="progress-bar"><span class="progress-fill" style="width:${action.progress}%"></span></span>
          ${action.progress}%
        </td>
        <td class="users">${users}</td>
        <td>${initiatives}</td>
      </tr>`
            })

            html += '\n      </tbody>\n    </table>'
          }

          html += '\n  </div>'
        })
      }

      html += '\n</div>'
    })
  }

  html += `\n<div class="footer">Exportado em ${new Date().toLocaleString('pt-BR')} - OKR Master</div>
</body></html>`

  return html
}

function cell(text, opts = {}) {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      opts.bold
        ? new Paragraph({ children: [new TextRun({ text: String(text), bold: true, color: opts.color })], alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT })
        : new Paragraph({ children: [new TextRun({ text: String(text), color: opts.color })], alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT }),
    ],
  })
}

function buildDocxSections(axes) {
  const sections = [{ children: [] }]
  const children = sections[0].children

  if (!axes || axes.length === 0) {
    children.push(new Paragraph({ children: [new TextRun('Nenhum dado disponível.')] }))
    return sections
  }

  axes.forEach((axis) => {
    const axisProgress = axis.objectives.length > 0
      ? Math.round(
          axis.objectives.reduce(
            (acc, o) => acc + (o.actions.length ? o.actions.reduce((s, a) => s + a.progress, 0) / o.actions.length : 0),
            0,
          ) / axis.objectives.length,
        )
      : 0

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [new TextRun(`Eixo: ${axis.name}  (Progresso: ${axisProgress}%)`)],
      }),
    )

    if (axis.objectives.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Nenhum Objetivo cadastrado.', italics: true, color: '888888' })] }))
    } else {
      axis.objectives.forEach((objective, objIdx) => {
        const objProgress = objective.actions.length
          ? Math.round(objective.actions.reduce((s, a) => s + a.progress, 0) / objective.actions.length)
          : 0

        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `OBJ-${String(objIdx + 1).padStart(2, '0')}: `, bold: true, color: '0F639D' }),
              new TextRun(objective.name),
              new TextRun({ text: `  (${objProgress}%)`, color: '0F639D', bold: true }),
            ],
          }),
        )

        if (objective.actions.length === 0) {
          children.push(new Paragraph({ children: [new TextRun({ text: 'Nenhum Key Result cadastrado.', italics: true, color: '888888' })] }))
        } else {
          const rows = [
            new TableRow({
              tableHeader: true,
              children: [
                cell('Key Result', { bold: true, shading: 'F0F4F8' }),
                cell('Status', { bold: true, shading: 'F0F4F8', center: true }),
                cell('Progresso', { bold: true, shading: 'F0F4F8', center: true }),
                cell('Equipe', { bold: true, shading: 'F0F4F8' }),
                cell('Iniciativas', { bold: true, shading: 'F0F4F8' }),
              ],
            }),
          ]

          objective.actions.forEach((action) => {
            const isDone = action.progress === 100
            const statusColor = isDone ? '16A34A' : '2563EB'
            const statusText = isDone ? 'Concluído' : 'Em andamento'
            const users = action.users?.map((u) => u.name).join(', ') || '-'
            const initiatives = action.initiatives?.length > 0
              ? action.initiatives.map((i) => `${i.completed ? '\u2713' : '\u25CB'} ${i.name}${i.completed ? ' (concluída)' : ''}`).join('\n')
              : 'Nenhuma'

            rows.push(
              new TableRow({
                children: [
                  cell(action.name, { bold: true }),
                  cell(statusText, { color: statusColor, center: true }),
                  cell(`${action.progress}%`, { center: true }),
                  cell(users),
                  cell(initiatives),
                ],
              }),
            )
          })

          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'EEEEEE' },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'EEEEEE' },
              },
              rows,
            }),
          )
        }
      })
    }
  })

  return sections
}

async function generateDocx(axes, companyName, year) {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun(`OKR - ${companyName} - ${year}`)],
          }),
          ...buildDocxSections(axes)[0].children,
          new Paragraph({
            spacing: { before: 300 },
            alignment: AlignmentType.CENTER,
            border: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
            },
            children: [new TextRun({ text: `Exportado em ${new Date().toLocaleString('pt-BR')} - OKR Master`, size: 18, color: '888888' })],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `OKR_${companyName?.replace(/\s+/g, '_')}_${year}.docx`)
}

export default function ExportModal({ open, onClose, axes, companyName, year }) {
  const { toast } = useToast()

  const htmlContent = useMemo(() => formatExportHTML(axes, companyName, year), [axes, companyName, year])

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) {
      toast('Bloqueado pelo navegador. Permita pop-ups para impressão.', 'error')
      return
    }
    win.document.write(htmlContent)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  const handleDownloadDocx = async () => {
    try {
      await generateDocx(axes, companyName, year)
      toast('Arquivo .docx baixado com sucesso!')
    } catch {
      toast('Erro ao gerar o arquivo .docx.', 'error')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Exportar Dados" wide>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-on-surface-variant">
          Exporte os dados de Eixos, Objetivos, Key Results e Iniciativas referentes a <strong>{companyName}</strong> - <strong>{year}</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low hover:border-[#0f639d] transition-all group"
          >
            <span className="material-symbols-outlined text-3xl text-[#0f639d] group-hover:scale-110 transition-transform">print</span>
            <span className="text-sm font-medium text-on-surface">Imprimir</span>
            <span className="text-xs text-on-surface-variant text-center">Abre uma janela com formatação para impressão ou salvar em PDF</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low hover:border-[#0f639d] transition-all group"
          >
            <span className="material-symbols-outlined text-3xl text-[#0f639d] group-hover:scale-110 transition-transform">description</span>
            <span className="text-sm font-medium text-on-surface">Baixar .docx</span>
            <span className="text-xs text-on-surface-variant text-center">Baixa um documento Word editável com todos os dados</span>
          </button>
        </div>

        <div className="border border-outline-variant/50 rounded-lg overflow-hidden">
          <div className="bg-surface-container-low px-4 py-2 flex items-center gap-2 border-b border-outline-variant/50">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility</span>
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Pré-visualização</span>
          </div>
          <div
            className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar text-sm bg-surface-container-lowest"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </Modal>
  )
}
