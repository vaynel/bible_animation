import type {CSSProperties, FC} from 'react';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/700.css';
import {Audio, Video} from '@remotion/media';
import {
  AbsoluteFill,
  Img,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {BibleProject, BibleScene} from '../model/project';

const fontFamily = '"Noto Sans KR", sans-serif';

const Wave: FC<{index: number; color: string; intensity: number}> = ({
  index,
  color,
  intensity,
}) => {
  const frame = useCurrentFrame();
  const shift = ((frame * (0.7 + index * 0.15)) % 220) - 220;

  return (
    <div
      style={{
        position: 'absolute',
        left: shift,
        bottom: 40 + index * 68,
        width: 2400,
        height: 130 + intensity * 18,
        borderRadius: '50%',
        borderTop: `${18 + intensity * 3}px solid ${color}`,
        opacity: 0.35 + index * 0.12,
        transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
      }}
    />
  );
};

const Boat: FC<{storm: boolean; sleeping: boolean}> = ({storm, sleeping}) => {
  const frame = useCurrentFrame();
  const rotation = Math.sin(frame / (storm ? 5 : 15)) * (storm ? 6 : 1.5);
  const vertical = Math.sin(frame / (storm ? 7 : 18)) * (storm ? 20 : 5);

  return (
    <div
      style={{
        position: 'absolute',
        left: 560,
        bottom: 250 + vertical,
        width: 800,
        height: 360,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: '50% 80%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 70,
          bottom: 20,
          width: 660,
          height: 150,
          background: '#8d5524',
          clipPath: 'polygon(0 0, 100% 0, 86% 100%, 14% 100%)',
          boxShadow: '0 30px 45px rgba(18, 31, 45, 0.28)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 388,
          bottom: 145,
          width: 18,
          height: 205,
          background: '#5d3a1e',
          borderRadius: 10,
        }}
      />
      {[0, 1, 2, 3].map((person) => (
        <div
          key={person}
          style={{
            position: 'absolute',
            left: 155 + person * 130,
            bottom: sleeping && person === 2 ? 115 : 145,
            width: sleeping && person === 2 ? 110 : 62,
            height: sleeping && person === 2 ? 45 : 105,
            borderRadius: sleeping && person === 2 ? 30 : '42% 42% 28% 28%',
            background: ['#d8a25e', '#486a8d', '#e9d1a7', '#8b6f9d'][person],
            transform:
              sleeping && person === 2
                ? 'rotate(-8deg)'
                : `rotate(${rotation / 2}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const PlaceholderScene: FC<{scene: BibleScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const storm = scene.motif === 'storm';
  const sleeping = scene.motif === 'sleep';
  const cloudOpacity = interpolate(
    frame,
    [0, 45],
    [0.2, storm ? 0.95 : 0.45],
    {extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${scene.palette[0]} 0%, ${scene.palette[1]} 58%, ${scene.palette[2]} 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: storm ? 180 : 1250,
          width: storm ? 1200 : 420,
          height: storm ? 270 : 160,
          borderRadius: '50%',
          background: storm ? '#394a5d' : '#f7f0df',
          opacity: cloudOpacity,
          filter: 'blur(3px)',
          boxShadow: storm
            ? '260px 40px 0 #46596e, 540px -20px 0 #324256'
            : '120px 20px 0 rgba(247, 240, 223, 0.8)',
        }}
      />
      <Boat storm={storm} sleeping={sleeping} />
      {[0, 1, 2, 3].map((index) => (
        <Wave
          key={index}
          index={index}
          color={index % 2 === 0 ? '#d9f2f0' : '#4c90a6'}
          intensity={storm ? 3 : 1}
        />
      ))}
      {scene.motif === 'calm' ? (
        <div
          style={{
            position: 'absolute',
            top: 85,
            right: 160,
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: '#fff2ad',
            boxShadow: '0 0 90px rgba(255, 242, 173, 0.8)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const SceneMedia: FC<{scene: BibleScene}> = ({scene}) => {
  const frame = useCurrentFrame();

  if (scene.media?.video) {
    return (
      <Video
        src={staticFile(scene.media.video)}
        muted
        loop
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    );
  }

  if (scene.media?.image) {
    const scale = interpolate(frame, [0, scene.durationSeconds * 30], [1, 1.08]);
    return (
      <Img
        src={staticFile(scene.media.image)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
    );
  }

  return <PlaceholderScene scene={scene} />;
};

const getCaption = (scene: BibleScene, second: number): string =>
  scene.captions
    ? (scene.captions.find(
        (caption) => second >= caption.startSeconds && second < caption.endSeconds,
      )?.text ?? '')
    : scene.narration;

const Scene: FC<{
  project: BibleProject;
  scene: BibleScene;
  sceneNumber: number;
}> = ({project, scene, sceneNumber}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = interpolate(
    frame,
    [0, 12, scene.durationSeconds * fps - 12, scene.durationSeconds * fps],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const caption = getCaption(scene, frame / fps);
  const titleStyle: CSSProperties = {
    position: 'absolute',
    top: 58,
    left: 72,
    padding: '15px 24px',
    borderRadius: 22,
    background: 'rgba(16, 29, 43, 0.68)',
    color: '#fff8e7',
    fontFamily,
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: -0.5,
  };

  return (
    <AbsoluteFill style={{opacity: fade, background: '#102133'}}>
      <SceneMedia scene={scene} />
      {scene.media?.audio ? (
        <Audio src={staticFile(scene.media.audio)} volume={1} />
      ) : null}
      <div style={titleStyle}>
        {sceneNumber}. {scene.title}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 62,
          right: 72,
          padding: '12px 20px',
          borderRadius: 18,
          background: 'rgba(255, 248, 231, 0.88)',
          color: '#293849',
          fontFamily,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {scene.sourceVerses.join(', ')}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 150,
          right: 150,
          bottom: 76,
          minHeight: 126,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px 42px',
          borderRadius: 30,
          background: 'rgba(10, 22, 35, 0.82)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.3)',
          color: 'white',
          fontFamily,
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.35,
          textAlign: 'center',
          wordBreak: 'keep-all',
        }}
      >
        {caption}
      </div>
      {sceneNumber === project.scenes.length &&
      frame > scene.durationSeconds * fps - 90 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 150,
            background: 'rgba(21, 45, 64, 0.9)',
            color: 'white',
            fontFamily,
            textAlign: 'center',
          }}
        >
          <div style={{fontSize: 68, fontWeight: 800, marginBottom: 30}}>
            {project.lesson.theme}
          </div>
          <div style={{fontSize: 40, lineHeight: 1.45}}>
            {project.lesson.closingQuestion}
          </div>
          <div style={{fontSize: 28, marginTop: 48, color: '#ffe6a1'}}>
            {project.passage.reference}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const BibleStory: FC<BibleProject> = (project) => (
  <AbsoluteFill style={{background: '#102133'}}>
    <Series>
      {project.scenes.map((scene, index) => (
        <Series.Sequence
          key={scene.id}
          durationInFrames={scene.durationSeconds * project.fps}
          name={`${index + 1}. ${scene.title}`}
        >
          <Scene project={project} scene={scene} sceneNumber={index + 1} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
