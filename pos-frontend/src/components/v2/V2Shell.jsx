import { useState } from "react";
import PropTypes from "prop-types";
import { useV2Ui } from "../../hooks/useV2Ui";
import BottomNav from "./BottomNav";

const V2Shell = ({ children }) => {
  const { v2UiEnabled } = useV2Ui();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!v2UiEnabled) {
    return children;
  }

  return (
    <div className="pb-20 transition-[margin] duration-300 lg:ml-[56px] lg:pb-0">
      {children}
      <BottomNav
        moreOpen={moreOpen}
        onMoreOpen={() => setMoreOpen(true)}
        onMoreClose={() => setMoreOpen(false)}
      />
    </div>
  );
};

V2Shell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default V2Shell;
