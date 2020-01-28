import { observable, action, computed, configure, runInAction } from 'mobx';
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';
import { history } from '../..';
import { toast } from 'react-toastify';

configure({ enforceActions: 'always' });

class ActivityStore {
  @observable activityRegistry = new Map();
  @observable activity: IActivity | null = null;
  @observable loadingInitial = false;
  @observable submitting = false;
  @observable target = '';

  @computed get activitiesByDate() {
    // return Array.from(this.activityRegistry.values()).sort(
    //   (a, b) => Date.parse(a.date) - Date.parse(b.date)
    // );
    return this.groupActivitiesByDate(Array.from(this.activityRegistry.values()));
  }

  groupActivitiesByDate(activities: IActivity[]) {
    const sortedActivities = activities.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
    return Object.entries(sortedActivities.reduce((activities, activity) => {
      const date = activity.date.toISOString().split('T')[0];
      activities[date] = activities[date] ? [...activities[date], activity] : [activity];
      return activities;
    }, {} as {[key: string]: IActivity[]}));
  }

  @action loadActivities = async () => {
    this.loadingInitial = true;
    try {
      const activities = await agent.Activities.list();
      runInAction('loading activities', () => {
        activities.forEach(activity => {
          activity.date = new Date(activity.date);
          this.activityRegistry.set(activity.id, activity);
        });
        this.loadingInitial = false;
      })

    } catch (error) {
      runInAction('load activities error', () => {
        this.loadingInitial = false;
      })
    }
  };

  @action loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity) {
      this.activity = activity;
      return activity;
    } else {
      this.loadingInitial = true;
      try {
        activity = await agent.Activities.details(id);
        runInAction('getting activity',() => {
          activity.date = new Date(activity.date);
          this.activity = activity;
          this.activityRegistry.set(activity.id, activity);
          this.loadingInitial = false;
        })
        return activity;
      } catch (error) {
        runInAction('get activity error', () => {
          this.loadingInitial = false;
        })
        console.log(error);
      }
    }
  }

  @action clearActivity = () => {
    this.activity = null;
  }

  getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  }

  @action createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);
      runInAction('create activity', () => {
        this.activityRegistry.set(activity.id, activity);
        this.submitting = false;
      })
      history.push(`/activities/${activity.id}`)
    } catch (error) {
      runInAction('create activity error', () => {
        this.submitting = false;
      })
      toast.error('Problem submitting data');
      console.log(error.response);
    }
  };

  @action editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction('editing activity', () => {
        this.activityRegistry.set(activity.id, activity);
        this.activity = activity;
        this.submitting = false;
      })
      history.push(`/activities/${activity.id}`)
    } catch (error) {
      runInAction('edit activity error', () => {
        this.submitting = false;
      })
      toast.error('Problem submitting data');
      console.log(error);
    }
  };

  @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);
      runInAction('deleting activity', () => {
        this.activityRegistry.delete(id);
        this.submitting = false;
        this.target = '';
      })
    } catch (error) {
      runInAction('delete activity error', () => {
        this.submitting = false;
        this.target = '';
      })
      console.log(error);
    }
  }

  @action pushActivities = () => {
    this.loadingInitial = true;
    agent.Activities.list()
      .then(activities => {
        runInAction('load activities then', () => {
          activities.forEach((activity) => {
            activity.date = activity.date.split('.')[0]
            this.activityRegistry.set(activity.id, activity);
          })
        });
      })
      .catch((error) => runInAction('load activities error', () => console.error(error)))
      .finally(() => runInAction('load activities finally', () => this.loadingInitial = false));
  };

  @action pushActivity = async (id: string) => {
    let activity = this.activityRegistry.get(id);
    if (activity) this.activity = activity;
    else {
      this.loadingInitial = true;
      agent.Activities.details(id)
        .then(() => {
          runInAction('load single activity then', () => {
            this.activityRegistry.set(id, activity);
            // this.selectedActivity = activity;
          })
        })
        .catch((error) => runInAction('load single activity error', () => console.error(error)))
        .finally(() => runInAction('load single activity finally', () => this.loadingInitial = false));
    }
  };

  @action creatActivity = (activity: IActivity) => {
    this.submitting = true;
    agent.Activities.create(activity)
      .then(() => {
        runInAction('create activity then', () => {
          this.activityRegistry.set(activity.id, activity);
        })
      })
      .catch((error) => runInAction('create activity error', () => console.error(error)))
      .finally(() => runInAction('create activity finally', () => this.submitting = false));
  };

  @action edActivity = (activity: IActivity) => {
    this.submitting = true;
    agent.Activities.update(activity)
      .then(() => {
        runInAction('edit activity then', () => {
          this.activityRegistry.set(activity.id, activity);
        })
      })
      .catch((error) => runInAction('edit activity error', () => console.error(error)))
      .finally(() => runInAction('edit activity finally', () => this.submitting = false));
  };

  @action delActivity = (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    agent.Activities.delete(id)
      .then(() =>
        runInAction('delete activity then', () => {
          this.activityRegistry.delete(id);
        })
      )
      .catch((error) => runInAction('delete activity error', () => console.error(error)))
      .finally(() =>
        runInAction('edit activity finally', () => {
          this.submitting = false;
          this.target = '';
        }));
  };
}

export default createContext(new ActivityStore());