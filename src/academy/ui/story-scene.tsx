import { asset } from "@/lib/art";
import type { StoryBackground, StoryMood, StoryPicture, StoryProp, StoryPropPlacement } from "../stories/catalog";
import { storyPropPlacement } from "../stories/catalog";
import { SquisheeImg } from "./bits";

export function PropArt({ id, label = id }: { id: StoryProp; label?: string }) {
  return <img src={asset(`art/story-props/${id}.png`)} alt={label} width={512} height={512} />;
}

export function StoryPicture({ picture, label }: { picture: StoryPicture; label?: string }) {
  switch (picture.kind) {
    case "pal":
      return <SquisheeImg id={picture.id} className="ac-story-choice-art" label={label ?? ""} squish="off" />;
    case "prop":
      return (
        <span className="ac-story-choice-art ac-story-choice-prop">
          <PropArt id={picture.id} label={label} />
        </span>
      );
    default: {
      const neverPicture: never = picture;
      return neverPicture;
    }
  }
}

export function StoryScene({
  mood,
  background,
  pals,
  prop,
  placement: placementOverride,
}: {
  mood: StoryMood;
  background: StoryBackground;
  pals: readonly string[];
  prop?: StoryProp;
  placement?: StoryPropPlacement;
}) {
  const placement = prop ? storyPropPlacement(prop, placementOverride) : null;
  return (
    <div className={`ac-story-scene is-${mood} is-bg-${background}`} aria-hidden="true">
      <img className="ac-story-background" src={asset(`art/story-backgrounds/${background}.webp`)} alt="" width={1200} height={900} />
      <div className={`ac-story-stage${placement && placement !== "ground" ? ` has-${placement}-prop` : ""}`}>
        <div className="ac-story-pals">
          {pals.map((id) => (
            <SquisheeImg key={id} id={id} className="ac-story-pal" squish="off" />
          ))}
        </div>
        {prop && placement === "ground" ? (
          <span className="ac-story-prop is-ground">
            <PropArt id={prop} />
          </span>
        ) : null}
      </div>
      {prop && placement && placement !== "ground" ? (
        <span className={`ac-story-prop is-${placement}`}>
          <PropArt id={prop} />
        </span>
      ) : null}
    </div>
  );
}
