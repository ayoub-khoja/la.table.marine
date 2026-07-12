import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'src/data/posts')

function listPostMarkdownFiles() {
  return fs.readdirSync(postsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
}

function parsePostDate(dateValue) {
  if (!dateValue) return null
  const dateObj = new Date(dateValue)
  return Number.isNaN(dateObj.getTime()) ? null : dateObj
}

function buildArchiveEntry(dateObj) {
  const monthOptions = { month: "long" }
  const yearsOptions = { year: "numeric" }

  return {
    id: `${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`,
    month: new Intl.DateTimeFormat("en-US", monthOptions).format(dateObj),
    year: new Intl.DateTimeFormat("en-US", yearsOptions).format(dateObj),
  }
}

function collectArchivesFromPosts(posts) {
  const archives = []

  posts.forEach((item) => {
    const dateObj = parsePostDate(item.date)
    if (!dateObj) return

    const itemObj = buildArchiveEntry(dateObj)
    if (!archives.some((entry) => entry.id === itemObj.id)) {
      archives.push(itemObj)
    }
  })

  return archives
}

function loadSortedPosts() {
  const fileNames = listPostMarkdownFiles()

  const allPostsData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '')
    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const matterResult = matter(fileContents)

    return {
      id,
      ...matterResult.data
    }
  })

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    }
    return -1
  })
}

export function getSortedArchivesData() {
  return collectArchivesFromPosts(loadSortedPosts())
}

export function getAllArchivesIds() {
  const archives = collectArchivesFromPosts(loadSortedPosts())

  return archives.map((item) => ({
    params: {
      id: item.id
    }
  }))
}

export async function getArchiveData(id) {
  const archives = collectArchivesFromPosts(loadSortedPosts())
  return archives.find((item) => item.id == id) || []
}