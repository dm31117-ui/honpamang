import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { RegionSearch } from '../../components/RegionSearch';
import { CloseIcon } from '../../components/Icons';
import type { Region } from '../../lib/geo';
import { loadProfile, saveProfile } from '../../lib/storage';
import { SUBMIT_HALLS, type Hall } from '../../data/museum';

export interface MuseumSubmission {
  nick: string;
  gu: string;
  title: string;
  hall: Hall;
}

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: MuseumSubmission) => void;
}

export function SubmitModal({ open, onClose, onSubmit }: SubmitModalProps) {
  const [nick, setNick] = useState('');
  const [regionQuery, setRegionQuery] = useState('');
  const [region, setRegion] = useState<Region | null>(null);
  const [text, setText] = useState('');
  const [hall, setHall] = useState<Hall>('자연재해관');

  // 메인과 같은 honpamang.profile 키를 공유한다.
  useEffect(() => {
    if (!open) return;
    const p = loadProfile();
    setNick(p?.nick ?? '');
    setRegionQuery(p?.gu ?? '');
    setRegion(null);
  }, [open]);

  const submit = () => {
    const title = text.trim();
    if (!title) return;
    const finalNick = nick.trim() || '익명의 망붕이';
    const gu = region?.label ?? regionQuery.trim() ?? '';
    saveProfile({ nick: finalNick, gu: gu || '전국' });
    onSubmit({ nick: finalNick, gu: gu || '전국', title, hall });
    setText('');
  };

  return (
    <Modal open={open} onClose={onClose} variant="pad32" labelledBy="submitModalTitle">
      <div className="modal__head">
        <h3 id="submitModalTitle" className="modal__title">
          혼파망 등록
        </h3>
        <button type="button" className="iconBtn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
      <p className="modal__desc">
        심사는 없습니다. 등록하면 바로 전시되고, 등급은 반응 수에 따라 올라갑니다.
      </p>

      <div className="modalFields">
        <div className="field">
          <label className="field__label" htmlFor="museumNick">
            닉네임
          </label>
          <input
            id="museumNick"
            className="input"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="익명의 망붕이"
          />
        </div>
        <RegionSearch
          id="museumRegion"
          query={regionQuery}
          picked={Boolean(region) && region?.label === regionQuery}
          onQueryChange={(v) => {
            setRegionQuery(v);
            setRegion(null);
          }}
          onPick={(r) => {
            setRegion(r);
            setRegionQuery(r.label);
          }}
          placeholder="예) 해운대 또는 부산"
        />
      </div>

      <textarea
        className="textarea muSubmit__text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예) 전자레인지 20분 돌린 삼각김밥의 몰락"
      />

      <div className="muSubmit__halls">
        {SUBMIT_HALLS.map((h) => (
          <button
            key={h}
            type="button"
            className="tab tab--sm"
            aria-pressed={hall === h}
            onClick={() => setHall(h)}
          >
            {h}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn--ink muSubmit__cta" onClick={submit}>
        바로 등록하기
      </button>
    </Modal>
  );
}
