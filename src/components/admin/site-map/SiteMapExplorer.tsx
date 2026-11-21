'use client'

import React, { useMemo, useState } from 'react'
import { vi } from '@/lib/i18n/vi'
import type {
  SiteMapCard,
  SiteMapData,
  SiteMapLink,
  SiteMapMenuNode,
} from '@/lib/cms/site-map.server'
import type { SiteMapKind } from '@/lib/cms/site-map-data'

const t = vi.cms.siteMap

const KIND_ORDER: SiteMapKind[] = ['builder', 'form', 'app', 'shared']

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
}

/** Every typed word must start a word of the card (accents ignored): "the" finds "thẻ", not "thiết". */
function cardMatches(card: SiteMapCard, query: string): boolean {
  if (!query) return true
  const words = normalize(
    [card.title, card.path, card.summary, ...card.links.map((l) => l.label), ...card.tips].join(
      ' ',
    ),
  ).split(/[^a-z0-9]+/)
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .every((q) => words.some((w) => w.startsWith(q)))
}

function EditButton({ link }: { link: SiteMapLink }) {
  return (
    <a href={link.href} className={`site-map-btn site-map-btn--${link.tone}`}>
      {link.tone === 'builder' ? '🧩 ' : '📝 '}
      {link.label}
    </a>
  )
}

function KindBadge({ kind }: { kind: SiteMapKind }) {
  return <span className={`site-map-kind site-map-kind--${kind}`}>{t.kinds[kind].label}</span>
}

function Card({ card }: { card: SiteMapCard }) {
  return (
    <article className="site-map-card" data-testid={`site-map-card-${card.id}`}>
      <header className="site-map-card__head">
        <div>
          <h3 className="site-map-card__title">{card.title}</h3>
          {card.openHref ? (
            <a
              className="site-map-card__path"
              href={card.openHref}
              target="_blank"
              rel="noopener noreferrer"
              title={t.openPage}
            >
              {card.path} ↗
            </a>
          ) : (
            <span className="site-map-card__path site-map-card__path--plain">{card.path}</span>
          )}
        </div>
        <KindBadge kind={card.kind} />
      </header>
      {card.badges.length > 0 && (
        <div className="site-map-card__badges">
          {card.badges.map((b) => (
            <span key={b.label} className={`site-map-badge site-map-badge--${b.tone}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}
      <p className="site-map-card__summary">{card.summary}</p>
      <div className="site-map-card__edits">
        <span className="site-map-card__label">{t.editAt}</span>
        {card.links.length > 0 ? (
          <div className="site-map-card__buttons">
            {card.links.map((link) => (
              <EditButton key={`${link.href}-${link.label}`} link={link} />
            ))}
          </div>
        ) : (
          <span className="site-map-card__none">{t.nothingToEdit}</span>
        )}
      </div>
      {card.tips.length > 0 && (
        <ul className="site-map-card__tips">
          {card.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {card.guides.length > 0 && (
        <div className="site-map-card__guides">
          <span className="site-map-card__label">{t.guide}</span>
          {card.guides.map((g) => (
            <a key={g.href} href={g.href} target="_blank" rel="noopener noreferrer">
              {g.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  )
}

function MenuTree({ nodes, title }: { nodes: SiteMapMenuNode[]; title: string }) {
  if (nodes.length === 0) return null
  return (
    <div className="site-map-tree">
      <div className="site-map-tree__root">{title}</div>
      <ul>
        {nodes.map((node, i) => (
          <MenuItem key={`${node.label}-${i}`} node={node} />
        ))}
      </ul>
    </div>
  )
}

function MenuItem({ node }: { node: SiteMapMenuNode }) {
  return (
    <li>
      <div className="site-map-tree__item">
        <span className="site-map-tree__label">{node.label}</span>
        {node.path && (
          <span className="site-map-tree__path">{node.external ? t.externalLink : node.path}</span>
        )}
        {node.edit ? (
          <a className={`site-map-chip site-map-chip--${node.edit.tone}`} href={node.edit.href}>
            {node.edit.tone === 'builder' ? '🧩' : '📝'} {node.edit.label}
          </a>
        ) : node.path && !node.external ? (
          <span className="site-map-chip site-map-chip--none">{t.seeBelow}</span>
        ) : null}
      </div>
      {node.groups.map((group, gi) => (
        <div key={gi} className="site-map-tree__group">
          {group.label && <div className="site-map-tree__group-label">{group.label}</div>}
          <ul>
            {group.items.map((child, ci) => (
              <MenuItem key={`${child.label}-${ci}`} node={child} />
            ))}
          </ul>
        </div>
      ))}
    </li>
  )
}

export function SiteMapExplorer({ data }: { data: SiteMapData }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<SiteMapKind | 'all'>('all')

  const groups = useMemo(
    () =>
      data.groups
        .map((g) => ({
          ...g,
          cards: g.cards.filter(
            (c) => (kind === 'all' || c.kind === kind) && cardMatches(c, query.trim()),
          ),
        }))
        .filter((g) => g.cards.length > 0),
    [data.groups, kind, query],
  )
  const total = groups.reduce((n, g) => n + g.cards.length, 0)

  return (
    <div className="site-map" data-testid="site-map">
      <header className="site-map__hero">
        <span className="site-map__eyebrow">{t.eyebrow}</span>
        <h1 className="site-map__title">{t.title}</h1>
        <p className="site-map__intro">{t.intro}</p>
        <ul className="site-map__legend">
          {KIND_ORDER.map((k) => (
            <li key={k}>
              <KindBadge kind={k} /> {t.kinds[k].hint}
            </li>
          ))}
        </ul>
      </header>

      <section className="site-map__section" aria-labelledby="site-map-menu">
        <h2 id="site-map-menu" className="site-map__h2">
          {t.menuTitle}
        </h2>
        <p className="site-map__desc">{t.menuDesc}</p>
        <div className="site-map__trees">
          <MenuTree nodes={data.menu} title={t.mainMenu} />
          <MenuTree nodes={data.footerMenu} title={t.footerMenu} />
          {data.menu.length === 0 && data.footerMenu.length === 0 && (
            <p className="site-map__empty">{t.menuEmpty}</p>
          )}
        </div>
        <a className="site-map-btn site-map-btn--form" href="/admin/globals/navigation">
          📝 {t.editMenu}
        </a>
      </section>

      <div className="site-map__toolbar" role="search">
        <label className="site-map__search">
          <span className="site-map__sr">{t.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            data-testid="site-map-search"
          />
        </label>
        <div className="site-map__filters" role="group" aria-label={t.filterLabel}>
          {(['all', ...KIND_ORDER] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              className={`site-map-filter${kind === k ? ' is-active' : ''}`}
              onClick={() => setKind(k)}
            >
              {k === 'all' ? t.filterAll : t.kinds[k].label}
            </button>
          ))}
        </div>
        <nav className="site-map__jump" aria-label={t.jumpLabel}>
          {groups.map((g) => (
            <a key={g.id} href={`#site-map-${g.id}`}>
              {g.title} <span>({g.cards.length})</span>
            </a>
          ))}
        </nav>
      </div>

      {total === 0 && <p className="site-map__empty">{t.noResult}</p>}

      {groups.map((group) => (
        <section
          key={group.id}
          id={`site-map-${group.id}`}
          className="site-map__section"
          aria-labelledby={`site-map-h-${group.id}`}
        >
          <h2 id={`site-map-h-${group.id}`} className="site-map__h2">
            {group.title}
          </h2>
          <p className="site-map__desc">{group.description}</p>
          <div className="site-map__grid">
            {group.cards.map((card) => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
