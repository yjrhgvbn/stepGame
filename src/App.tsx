import { Grid } from './Grid';
import Idioms from './Idioms';
import Poetry from './Poetry';
import { ConvertAnimate } from './animate';
import classNames from 'classnames';
import { useWindowSize } from 'react-use';

export default function App() {
  const { width, height } = useWindowSize();
  return (
    <div className={classNames('')}>
      <div className="flex flex-row bg-gray-100 text-gray-800">
        {width > 640 && (
          <aside className="hidden h-screen -translate-x-full transform overflow-scroll bg-white p-4 transition-transform duration-150 ease-in sm:block sm:w-80 sm:translate-x-0 lg:w-[30rem] lg:translate-x-0 lg:shadow-md">
            <Poetry />
            <Idioms />
          </aside>
        )}
        <main className="main flex flex-grow flex-col p-4 transition-all duration-150 ease-in sm:ml-0 lg:ml-0 ">
          {width <= 640 && (
            <div className={classNames('sm:hidden')}>
              <Poetry />
            </div>
          )}
          <Grid />
          {width <= 640 && (
            <div className={classNames('sm:hidden')}>
              <Idioms />
            </div>
          )}
        </main>
      </div>
      <ConvertAnimate />
    </div>
  );
}
