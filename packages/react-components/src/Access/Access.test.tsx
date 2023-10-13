import { render, screen } from '@testing-library/react';
import { Access } from './Access';
import React from 'react';

describe('<Access />', () => {
  it('正常渲染', () => {
    render(<Access accessible>children</Access>);

    expect(screen.getByText('children')).toBeInTheDocument();
  });

  it('accessible false 不会显示', () => {
    render(<Access accessible={false}>children</Access>);

    expect(screen.queryByText('children')).not.toBeInTheDocument();
  });
});
