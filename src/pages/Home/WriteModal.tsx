import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { RegionSearch } from '../../components/RegionSearch';
import { CloseIcon } from '../../components/Icons';
import type { Region } from '../../lib/geo';
import { loadProfile, saveProfile } from '../../lib/storage';

export interface WriteSubmission {
  nick: string;
  /** 지역 식별자 겸 표기 라벨 "{시도} {구·군}" — 지도 핀 좌표도 이걸로 찾는다. */
  gu: string;
  text: string;
}

interface WriteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: WriteSubmission) => void;
  /** 지도에서 "여기 상황 쓰기"로 열었을 때 미리 채워지는 지역 라벨 */
  presetRegion?: string;
}

export function WriteModal({ open, onClose, onSubmit, presetRegion }: WriteModalProps) {
  const [nick, setNick] = useState('');
  const [regionQuery, setRegionQuery] = useState('');
  const [region, setRegion] = useState<Region | null>(null);
  /** 아직 손대지 않은 프리필 값 위에 드롭다운을 띄우지 않는다. */
  const [dirty, setDirty] = useState(false);
  const [text, setText] = useState('');

  // 열릴 때마다 저장된 프로필 + 지도에서 넘어온 지역으로 초기화.
  useEffect(() => {
    if (!open) return;
    const p = loadProfile();
    setNick(p?.nick ?? '');
    setRegion(null);
    setDirty(false);
    setRegionQuery(presetRegion || (p?.gu ?? ''));
  }, [open, presetRegion]);

  const submit = () => {
    const story = text.trim();
    // 빈 값이면 아무것도 올리지 않고 그냥 닫힌다 (프로토타입 동작 유지).
    if (!story) {
      onClose();
      return;
    }
    const finalNick = nick.trim() || '익명의 망붕이';
    const gu = (region?.label ?? regionQuery.trim()) || '전국';
    saveProfile({ nick: finalNick, gu });
    onSubmit({ nick: finalNick, gu, text: story });
    setText('');
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="writeModalTitle">
      <div className="modal__head">
        <h3 id="writeModalTitle" className="modal__title">
          상황 작성
        </h3>
        <button type="button" className="iconBtn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
      <p className="modal__desc">
        지금 멘탈 터진 상황을 한 줄로. 익명으로 전국 비상벨에 올라갑니다.
      </p>

      <div className="modalFields">
        <div className="field">
          <label className="field__label" htmlFor="writeNick">
            닉네임
          </label>
          <input
            id="writeNick"
            className="input"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="익명의 망붕이"
          />
        </div>
        <RegionSearch
          id="writeRegion"
          query={regionQuery}
          picked={!dirty || region?.label === regionQuery}
          onQueryChange={(v) => {
            setRegionQuery(v);
            setRegion(null);
            setDirty(true);
          }}
          onPick={(r) => {
            setRegion(r);
            setRegionQuery(r.label);
          }}
          placeholder="예) 마포 또는 서울"
        />
      </div>

      <textarea
        className="textarea writeModal__text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예) 대표님한테 '네' 대신 '웅' 보냄..."
      />

      <button type="button" className="btn btn--accent writeModal__submit" onClick={submit}>
        전국에 울리기
      </button>
    </Modal>
  );
}
