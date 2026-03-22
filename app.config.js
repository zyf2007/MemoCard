const DATE_TIME_SUFFIX_REGEX = /-\d{8}-\d{6}$/;

function formatBuildStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

module.exports = ({ config }) => {
  const rawVersion = config.version || '1.0.0';
  const baseVersion = rawVersion.replace(DATE_TIME_SUFFIX_REGEX, '');
  const buildVersion = `${baseVersion}-${formatBuildStamp()}`;

  return {
    ...config,
    version: buildVersion,
    extra: {
      ...(config.extra || {}),
      buildVersion,
    },
  };
};
