import './index.css';

/**
 * find partner page - displaying possible match
 */
const FindPartnerPage = () => {
  return (
    <div className='partner-finder-container'>
      <div className='partner-finder-header'>
        <h2>Find Your Partner</h2>
        <p>Connect with users who share your skills</p>
      </div>

      <div className='search-section'>
        <div className='current-user-skills'>
          <h3>Your Skills</h3>
          <div className='no-skills-message'>
            <p>Feature coming soon! Add your skills to find matching partners.</p>
          </div>
        </div>
      </div>

      <div className='results-section'>
        <div className='results-header'>
          <h3>Matching Users</h3>
          <p className='results-subtitle'>
            Users with matching skills will appear here
          </p>
        </div>

        <div className='users-list'>
          <div className='no-results-message'>
            Partner matching feature is under development
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindPartnerPage;