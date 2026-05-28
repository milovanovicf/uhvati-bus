const DIACRITICS: Record<string, string> = {
  š: 's', Š: 'S',
  đ: 'dj', Đ: 'Dj',
  č: 'c', Č: 'C',
  ć: 'c', Ć: 'C',
  ž: 'z', Ž: 'Z',
}

export function slugify(name: string): string {
  return name
    .split('')
    .map((c) => DIACRITICS[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function cityToSlug(name: string): string {
  return slugify(name)
}

export function slugToCity(slug: string, cities: { id: number; name: string }[]) {
  return cities.find((c) => slugify(c.name) === slug) ?? null
}
