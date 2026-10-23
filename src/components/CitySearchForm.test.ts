import { fireEvent, screen } from '@testing-library/dom';
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { CitySearchForm } from './CitySearchForm';

function setupForm() {
  document.body.innerHTML = `
    <form id="form">
      <input id="city" maxlength="100" />
      <button type="submit">Buscar</button>
      <p id="validation" role="alert" hidden></p>
    </form>
  `;
  const form = document.querySelector<HTMLFormElement>('#form');
  const input = document.querySelector<HTMLInputElement>('#city');
  const validation = document.querySelector<HTMLElement>('#validation');
  if (!form || !input || !validation) throw new Error('Test form not initialized');
  const onSearch = vi.fn<(cityName: string) => void>();
  new CitySearchForm(form, input, validation, onSearch);
  return { form, input, validation, onSearch };
}

describe('CitySearchForm', () => {
  it('Property 1: rejects empty and whitespace-only city names without searching', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map((chars) => chars.join('')),
        (cityName) => {
          const { form, input, validation, onSearch } = setupForm();
          fireEvent.change(input, { target: { value: cityName } });
          fireEvent.submit(form);
          expect(onSearch).not.toHaveBeenCalled();
          expect(validation.hidden).toBe(false);
          expect(validation.textContent).toContain('obligatorio');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 2: trims leading and trailing whitespace before searching', () => {
    const nonWhitespace = fc.string({ minLength: 1 }).filter((value) => value.trim().length > 0);
    fc.assert(
      fc.property(nonWhitespace, fc.string(), fc.string(), (city, left, right) => {
        const { form, input, onSearch } = setupForm();
        const entered = `${left} ${city} ${right}`;
        fireEvent.change(input, { target: { value: entered } });
        fireEvent.submit(form);
        expect(onSearch).toHaveBeenCalledWith(entered.trim());
      }),
      { numRuns: 100 },
    );
  });

  it('renders the 100-character limit, supports click and Enter submission', () => {
    const { input, onSearch } = setupForm();
    expect(input.maxLength).toBe(100);

    fireEvent.change(input, { target: { value: 'Lima' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenLastCalledWith('Lima');

    fireEvent.change(input, { target: { value: 'Quito' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSearch).toHaveBeenLastCalledWith('Quito');
  });
});
