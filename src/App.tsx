import { Grid } from './Grid';
import Idioms from './Idioms';
import Poetry from './Poetry';
import classNames from 'classnames';

export default function App() {
  return (
    <div className={classNames('mb-20')}>
      <Poetry />
      <Grid />
      <Idioms />
    </div>
  );
}
