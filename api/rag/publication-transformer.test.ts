import { describe, expect, test } from "bun:test"
import { transformPublication } from "./publication-transformer"

const record = {
  id: 12345,
  doi_url: "https://doi.org/10.5281/zenodo.12345",
  metadata: {
    title: "Étude de référence",
    publication_date: "2024-06",
    access_right: "open",
    keywords: ["Éducation", "Recherche"],
    resource_type: { subtype: "article" },
  },
}

const file = { id: "file-uuid", key: "rapport.pdf" }

describe("transformZenodoPublication", () => {
  test("converts OCR pages into publication chunks with normalized metadata", () => {
    const [chunk] = transformPublication(record, file, {
      pages: [
        {
          index: 0,
          markdown: `# Résultats\n\n${"Données détaillées sur les résultats et les évolutions observées. ".repeat(2)} $\u005e{1}$`,
        },
      ],
    })

    expect(chunk).toBeDefined()
    expect(chunk?.id).toBe("zenodo_12345_rapport_p1_s1_c1")
    expect(chunk?.document).not.toContain("^{1}")
    expect(chunk?.metadata).toMatchObject({
      title: "Étude de référence",
      reference: "zenodo",
      record_id: "12345",
      publication_type: "article",
      publication_date: "2024-06",
      publication_epoch: Date.parse("2024-06-01T00:00:00Z") / 1000,
      file_id: "file-uuid",
      file_name: "rapport.pdf",
      file_format: "pdf",
      file_url: "https://doi.org/10.5281/zenodo.12345",
      file_access: "open",
      keywords: ["éducation", "recherche"],
      page_index: 1,
      section_index: 1,
      section_title: "Résultats",
      section_level: 1,
      chunk_type: "paragraph",
    })
  })

  test("expands OCR tables, removes image references, and splits long chunks", () => {
    const chunks = transformPublication(record, file, {
      pages: [
        {
          markdown: "![graphique.jpeg](image.jpeg)\n\n[tbl-1.md](tbl-1.md)",
          tables: [{ id: "tbl-1.md", content: `| colonne |\n| valeur ${"mesurée ".repeat(10)}|` }],
        },
        { markdown: "Autre contenu détaillé. ".repeat(160) },
      ],
    })

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((chunk) => chunk.document.length <= 3_000)).toBe(true)
    expect(chunks[0]?.metadata.chunk_type).toBe("table")
    expect(chunks.slice(1).every((chunk) => chunk.metadata.chunk_type === "paragraph")).toBe(true)
    expect(chunks[0]?.document).not.toContain("image.jpeg")
    expect(chunks[0]?.document).toContain("| colonne |")
  })

  test("handles multiline OCR headings, image links of any type, and letter superscripts", () => {
    const [chunk] = transformPublication(record, file, {
      pages: [
        {
          index: 0,
          markdown: [
            "# L'état",
            "de l'Emploi",
            "scientifique",
            "en France",
            "",
            `En 2022, la France se situe au 6$^{e}$ rang. ${"Données détaillées. ".repeat(4)}`,
            "",
            "![graphique](figure.png)",
          ].join("\n"),
        },
      ],
    })

    expect(chunk?.metadata.section_title).toBe("L'état de l'Emploi scientifique en France")
    expect(chunk?.document).toContain("6e rang")
    expect(chunk?.document).not.toContain("$^{e}$")
    expect(chunk?.document).not.toContain("figure.png")
  })

  test("does not carry undersized content across section boundaries", () => {
    const chunks = transformPublication(record, file, {
      pages: [
        {
          markdown: [
            "# Court",
            "",
            "Contenu trop court.",
            "",
            "# Section complète",
            "",
            "Ce paragraphe est suffisamment long pour créer un chunk dans la nouvelle section.",
          ].join("\n"),
        },
      ],
    })

    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.metadata.section_title).toBe("Section complète")
    expect(chunks[0]?.document).not.toContain("Contenu trop court")
  })

  test("skips short sections and returns no chunks when OCR has no pages", () => {
    expect(transformPublication(record, file, { pages: [{ markdown: "# Court\n\nTrop court." }] })).toEqual([])
    expect(transformPublication(record, file, {})).toEqual([])
  })

  test("rejects invalid publication dates", () => {
    expect(() =>
      transformPublication({ ...record, metadata: { ...record.metadata, publication_date: "not-a-date" } }, file, {
        pages: [{ markdown: "Une section assez longue pour atteindre la taille minimale du chunk utile." }],
      }),
    ).toThrow("Invalid publication date: not-a-date")
  })
})
