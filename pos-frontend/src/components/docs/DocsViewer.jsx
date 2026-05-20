import PropTypes from "prop-types";
import DocsEditor from "./DocsEditor";

const DocsViewer = ({ content }) => {
  return (
    <div className="docs-viewer">
      <DocsEditor content={content} editable={false} />
    </div>
  );
};

DocsViewer.propTypes = {
  content: PropTypes.string,
};

export default DocsViewer;
