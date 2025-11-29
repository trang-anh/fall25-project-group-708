import fs from 'fs';
import path from 'path';
import avatarUpload from '../../utils/multer.config';

jest.mock('fs');

describe('avatarUpload multer config', () => {
  const reqMock: any = { body: { username: 'testuser' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create the uploads/avatar directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const cb = jest.fn();
    const destinationFn = (avatarUpload as any).storage.getDestination;

    destinationFn(reqMock, {} as any, cb);

    const expectedPath = path.join(__dirname, '..', '..', 'uploads', 'avatar');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedPath, { recursive: true });
    expect(cb).toHaveBeenCalledWith(null, expectedPath);
  });

  it('should generate a filename correctly', () => {
    const cb = jest.fn();
    const fileMock = { originalname: 'avatar.png' };
    const filenameFn = (avatarUpload as any).storage.getFilename;

    filenameFn(reqMock, fileMock, cb);

    const calledArg = cb.mock.calls[0][1] as string;
    expect(calledArg.startsWith('testuser-')).toBe(true);
    expect(calledArg.endsWith('.png')).toBe(true);
  });

  it('should accept valid file types', () => {
    const cb = jest.fn();
    const fileMock = { mimetype: 'image/png' };
    const fileFilterFn = (avatarUpload as any).fileFilter;

    fileFilterFn(reqMock, fileMock, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should reject invalid file types', () => {
    const cb = jest.fn();
    const fileMock = { mimetype: 'application/pdf' };
    const fileFilterFn = (avatarUpload as any).fileFilter;

    fileFilterFn(reqMock, fileMock, cb);

    expect(cb).toHaveBeenCalledWith(expect.any(Error));
    expect(cb.mock.calls[0][0].message).toMatch(/Invalid file type/);
  });

  it('should limit file size to 5MB', () => {
    const limits = (avatarUpload as any).limits;
    expect(limits.fileSize).toBe(5 * 1024 * 1024);
  });
});
