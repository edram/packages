import { renderHook } from '@testing-library/react-hooks';
import useClickAway from '../src/useClickAway';

describe('useClickAway', () => {
  let container: HTMLDivElement;
  let away: HTMLDivElement;
  let container1: HTMLDivElement;
  let container2: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    away = document.createElement('div');
    container1 = document.createElement('div');
    container2 = document.createElement('div');
    document.body.appendChild(container);
    document.body.appendChild(container1);
    document.body.appendChild(container2);
    document.body.appendChild(away);
  });

  it('点击 away 应该触发 onClick 事件', () => {
    const handleClick = vi.fn();
    away.onclick = handleClick;

    expect(handleClick).toHaveBeenCalledTimes(0);
    away.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
    away.click();
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('点击 container 不应该触发 onClickAway 事件', () => {
    const handleClickAway = vi.fn();

    renderHook(() => useClickAway(handleClickAway, container));

    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);
  });

  it('点击 away 应该触发 onClickAway 事件', () => {
    const handleClickAway = vi.fn();

    renderHook(() => useClickAway(handleClickAway, container));

    expect(handleClickAway).toHaveBeenCalledTimes(0);
    away.click();
    expect(handleClickAway).toHaveBeenCalledTimes(1);
    away.click();
    expect(handleClickAway).toHaveBeenCalledTimes(2);
  });

  it('测试数组', () => {
    const handleClickAway = vi.fn();

    renderHook(() => useClickAway(handleClickAway, [container1, container2]));

    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container1.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container2.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);

    away.click();
    expect(handleClickAway).toHaveBeenCalledTimes(1);
    container.click();
    expect(handleClickAway).toHaveBeenCalledTimes(2);
  });

  it('测试 classname', () => {
    const handleClickAway = vi.fn();
    container1.classList.add('container');
    container2.classList.add('container');
    renderHook(() => useClickAway(handleClickAway, '.container'));

    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container1.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);
    container2.click();
    expect(handleClickAway).toHaveBeenCalledTimes(0);

    away.click();
    expect(handleClickAway).toHaveBeenCalledTimes(1);
    container.click();
    expect(handleClickAway).toHaveBeenCalledTimes(2);
  });
});
