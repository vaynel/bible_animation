import type {FC} from 'react';
import {Composition} from 'remotion';
import sampleProjectJson from '../../public/projects/storm/project.json';
import {
  BibleProjectSchema,
  getDurationInFrames,
  type BibleProject,
} from '../model/project';
import {BibleStory} from './BibleStory';

const sampleProject = BibleProjectSchema.parse(sampleProjectJson);

export const RemotionRoot: FC = () => (
  <Composition
    id="BibleStory"
    component={BibleStory}
    defaultProps={sampleProject}
    durationInFrames={getDurationInFrames(sampleProject)}
    fps={sampleProject.fps}
    width={sampleProject.width}
    height={sampleProject.height}
    calculateMetadata={({props}) => {
      const project = BibleProjectSchema.parse(props);
      return {
        durationInFrames: getDurationInFrames(project),
        fps: project.fps,
        width: project.width,
        height: project.height,
        props: project,
      };
    }}
  />
);
