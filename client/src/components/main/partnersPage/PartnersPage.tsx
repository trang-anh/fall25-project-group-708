import { useState, useEffect } from 'react';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { sendConnectionRequest, getPartnerMatches } from '../../../services/partnerService';


interface Partner {
  username: string;
  email: string;
  skills: string[];
  biography?: string;
  matchingSkills: string[];
  connectionStatus: 'none' | 'pending' | 'received' | 'connected';
}

/**
 * PartnersPage displays potential coding partners based on shared skills.
 * Users can send connection requests, and chats become available only
 * when both users have mutually connected.
 */
const PartnersPage = () => {
  const { user } = useUserContext();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [processingRequest, setProcessingRequest] = useState<string>(''); 

  useEffect(() => {
    fetchPartners();
  }, [user.username]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPartnerMatches(user.username);
      setPartners(data.partners || []);
    } catch (err) {
      setError('Failed to load potential partners. Please try again later.');
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (partnerUsername: string) => {
    try {
      setProcessingRequest(partnerUsername);
      const result = await sendConnectionRequest(user.username, partnerUsername);
      
      // Update the partner's connection status
      setPartners(prevPartners =>
        prevPartners.map(p =>
          p.username === partnerUsername
            ? { ...p, connectionStatus: result.mutualConnection ? 'connected' : 'pending' }
            : p
        )
      );

      // Show success message if mutual connection
      if (result.mutualConnection) {
        alert(`You are now connected with ${partnerUsername}! You can start chatting.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
      console.error('Error sending connection request:', err);
    } finally {
      setProcessingRequest('');
    }
  };

  const renderConnectionButton = (partner: Partner) => {
    const isProcessing = processingRequest === partner.username;

    switch (partner.connectionStatus) {
      case 'connected':
        return (
          <button className='partner-btn partner-btn-connected' disabled>
            ✓ Connected
          </button>
        );
      case 'pending':
        return (
          <button className='partner-btn partner-btn-pending' disabled>
            Request Sent
          </button>
        );
      case 'received':
        return (
          <button
            className='partner-btn partner-btn-accept'
            onClick={() => handleConnect(partner.username)}
            disabled={isProcessing}>
            {isProcessing ? 'Connecting...' : 'Accept Connection'}
          </button>
        );
      case 'none':
      default:
        return (
          <button
            className='partner-btn partner-btn-connect'
            onClick={() => handleConnect(partner.username)}
            disabled={isProcessing}>
            {isProcessing ? 'Sending...' : 'Connect'}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className='partners-page'>
        <div className='partners-header'>
          <h1>Find Partners</h1>
          <p className='partners-subtitle'>Connect with developers who share your skills</p>
        </div>
        <div className='loading-container'>
          <p>Loading potential partners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='partners-page'>
        <div className='partners-header'>
          <h1>Find Partners</h1>
          <p className='partners-subtitle'>Connect with developers who share your skills</p>
        </div>
        <div className='error-container'>
          <p className='error-message'>{error}</p>
          <button onClick={fetchPartners} className='retry-btn'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='partners-page'>
      <div className='partners-header'>
        <h1>Find Partners</h1>
        <p className='partners-subtitle'>Connect with developers who share your skills</p>
      </div>

      {partners.length === 0 ? (
        <div className='no-partners'>
          <p>No potential partners found with matching skills.</p>
          <p className='hint'>
            Make sure you have skills added to your profile to find matching partners!
          </p>
        </div>
      ) : (
        <div className='partners-grid'>
          {partners.map(partner => (
            <div key={partner.username} className='partner-card'>
              <div className='partner-header'>
                <div className='partner-avatar'>
                  {partner.username.charAt(0).toUpperCase()}
                </div>
                <div className='partner-info'>
                  <h3 className='partner-username'>{partner.username}</h3>
                  <p className='partner-email'>{partner.email}</p>
                </div>
              </div>

              {partner.biography && (
                <p className='partner-bio'>{partner.biography}</p>
              )}

              <div className='skills-section'>
                <h4>Matching Skills</h4>
                <div className='skills-container'>
                  {partner.matchingSkills.map(skill => (
                    <span key={skill} className='skill-tag skill-tag-match'>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {partner.skills.length > partner.matchingSkills.length && (
                <div className='skills-section'>
                  <h4>Other Skills</h4>
                  <div className='skills-container'>
                    {partner.skills
                      .filter(skill => !partner.matchingSkills.includes(skill))
                      .map(skill => (
                        <span key={skill} className='skill-tag'>
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className='partner-actions'>
                {renderConnectionButton(partner)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnersPage;