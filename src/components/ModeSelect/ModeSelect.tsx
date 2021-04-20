import React from "react";
import { IoCaretDownSharp } from "react-icons/io5";

import { modes, Mode } from "modes";
import { Select } from "components";

import styles from "./ModeSelect.module.scss";

type Props = { mode: Mode } & Omit<
    React.ComponentProps<typeof Select>,
    "items" | "selectedItem" | "onSelect"
>;

const noop = () => {};

const ModeSelect = (props: Props) => {
    const { mode, ...restProps } = props;
    return (
        <Select
            {...restProps}
            items={Object.values(modes)}
            selectedItem={modes[mode]}
            onSelect={noop}
            disclosure={(i) => (
                <div className={styles.modeSelect}>
                    {i.label}
                    <IoCaretDownSharp size={12} style={{ marginLeft: 5 }} />
                </div>
            )}
        />
    );
};

export default ModeSelect;
