import React, { useContext } from 'react';
import { Menu, Container, Button } from 'semantic-ui-react';
import ActivityStore from '../../app/stores/activityStore';
import { observer } from 'mobx-react-lite';
import { Link , NavLink} from 'react-router-dom';

const NavBar: React.FC = () => {
  const activityStore = useContext(ActivityStore);
  return (
    <Menu fixed='top' inverted>
      <Container>
        <Menu.Item header as={Link} exact to='/'>
            <img src="/assets/logo.png" alt="logo" style={{marginRight: 10}}/>
            Reactivities
        </Menu.Item>
        <Menu.Item name='Activities' as={NavLink} to='/activities'/>
        <Menu.Item>
            <Button as={Link} to='/createActivity' 
            positive 
            content='Create Activity' />
        </Menu.Item>
      </Container>
    </Menu>
  );
};

export default observer(NavBar);
