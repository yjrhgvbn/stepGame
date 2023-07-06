import { Grid } from './Grid';
import Idioms from './Idioms';
import Poetry from './Poetry';
import classNames from 'classnames';

export default function App() {
  return (
    <div className={classNames('')}>
      <div className="flex flex-row bg-gray-100 text-gray-800">
        {/* TODO aside 增加滚动 因为overflow属性会导致元素超出隐藏，按目前的动画实现，会导致动画无法显示 */}
        <aside className="hidden h-screen -translate-x-full transform bg-white p-4 transition-transform duration-150 ease-in sm:block sm:w-80 sm:translate-x-0 lg:w-[30rem] lg:translate-x-0 lg:shadow-md">
          <Poetry />
          <Idioms />
        </aside>
        <main className="main flex flex-grow flex-col p-4 transition-all duration-150 ease-in sm:ml-0 lg:ml-0 ">
          <div className={classNames('sm:hidden')}>
            <Poetry />
          </div>
          <Grid />
          <div className={classNames('sm:hidden')}>
            <Idioms />
          </div>
        </main>
      </div>
    </div>
  );
}
