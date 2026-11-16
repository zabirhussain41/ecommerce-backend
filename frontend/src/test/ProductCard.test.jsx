import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

describe('ProductCard', () => {
  it('renders product info and price', () => {
    const product = { id: 1, name: 'Test Mug', price: 12.5, stock: 5, category: { name: 'Kitchen' } }
    render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>)
    expect(screen.getByText('Test Mug')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('shows out-of-stock overlay', () => {
    const product = { id: 2, name: 'Empty', price: 1, stock: 0 }
    render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>)
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('shows discount badge when originalPrice > price', () => {
    const product = { id: 3, name: 'Sale', price: 10, originalPrice: 20, stock: 3 }
    render(<MemoryRouter><ProductCard product={product} /></MemoryRouter>)
    expect(screen.getByText('-50%')).toBeInTheDocument()
    expect(screen.getByText('$20.00')).toBeInTheDocument()
  })
})
